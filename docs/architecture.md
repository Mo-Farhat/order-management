# Architecture notes

Companion to the PRD. Covers how Phase 1 is actually built. Kept short; the code
is the source of truth.

## Stack

See PRD §9. In one line: Next.js 16 App Router + Drizzle + Neon Postgres +
Auth.js v5, deployed to Cloudflare, no Prisma.

## Directory layout

```
app/                     App Router routes
  (auth)/                login, signup, verify-request  (public)
  onboarding/business/   business-basics step           (auth, no tenant yet)
  s/[slug]/              public storefront + [id] product page (public, no auth)
  api/v1/                read API — products, catalog   (public, bearer key)
  desk/                  the authed app                 (auth + tenant)
    layout.tsx           sidebar + topbar shell + CSV export links
    page.tsx             Dashboard (metrics, recent orders)
    orders/              order list (inline status), new-order flow, [id] detail, [id]/edit
    catalog/             product list, new, [id] edit, import
    share/               storefront settings (WhatsApp #, accent, category chips, pause, QR)
    settings/            business settings + change password
    export/[entity]/     CSV download route handler
components/desk/         shell nav + shared UI packaging (Card, Table, Btn…)
  actions/               server actions (auth, onboarding, session, catalog, orders)
  api/auth/[...nextauth] Auth.js route handlers
auth.ts                  full Auth.js config (Node runtime)
auth.config.ts           edge-safe subset used by proxy.ts
proxy.ts                 route protection (Next 16's renamed middleware)
db/
  schema.ts              Drizzle schema — single source of DB truth
  index.ts               `db` — neon-http client (no transactions)
  tenant.ts              `pooledDb()` + `withTenant()` — WebSocket pool, transactions
lib/
  pipeline.ts            pure order-status machine (isLegalTransition) — no DB
  rbac.ts                capability matrix + can()/assertCan()
  api-keys.ts            /api/v1 key mint / hash / resolve
  public-api.ts          catalog shape for the read API
  s3-sigv4.ts            tiny AWS SigV4 signer (no SDK — small Worker bundle)
  upsell.ts              FR-23 "time for a website" banner logic
  session.ts             requireUser / requireActive / requireCapability
  validation.ts          zod schemas
  email.ts               magic-link sender (console in dev)
  catalog.ts             product CRUD + stock ledger (server-only)
  csv-import.ts          CSV parse / preview / all-or-nothing commit
  storage.ts             S3-compatible upload (SigV4, no SDK) — Cloudflare R2
  settings.ts (actions)  business settings + password change
drizzle/                 generated migrations
scripts/apply-rls.ts     installs RLS policies + provisions the app_runtime role
open-next.config.ts      Cloudflare Workers adapter (@opennextjs/cloudflare)
wrangler.jsonc           Worker config (nodejs_compat, ASSETS binding)
vitest.config.ts         unit tests — lib/**/*.test.ts
```

## Data model (Phase 1)

| Table | Purpose |
|---|---|
| `tenants` | one row per business. Carries the config-not-customisation settings (`currency`, `stock_tracking_enabled`, `delivery_fee_default`, `public_page_paused`) and billing fields (`plan_status`, `trial_ends_at`). |
| `users` | one row per person. `hashed_password` is null for magic-link-only users. `password_changed_at` drives session invalidation. |
| `memberships` | user × tenant × role. Unique on `(user_id, tenant_id)`. v1 creates exactly one per user. |
| `audit_log` | actor + before/after JSON per mutation (NFR "auditability"). |
| `accounts` / `sessions` / `verification_tokens` | Auth.js adapter tables. Sessions are JWTs, but the table exists for the adapter contract. |

### Catalog (Phase 2)

| Table | Purpose |
|---|---|
| `products` | name, price (`numeric`), `stock_qty`, plus optional description / category / `low_stock_threshold` / sku. `archived_at` is the soft-delete marker (FR-6). No variants. |
| `product_photos` | up to 4 per product (`MAX_PHOTOS`), each ≤ 3 MB; stores the R2 object `key`, public URL derived at read time. |
| `stock_movements` | append-only ledger (FR-5). Every `stock_qty` change writes a row: `delta`, `balance_after`, `reason` enum, actor, optional note / `order_id` (FK wired in Phase 3). |

Catalog reads use `db` with an explicit `tenantId` filter. Every mutation that
touches stock (`createProduct`, `updateProduct`, `setStock`, CSV `commitImport`)
runs inside `withTenant()` so the product write and its ledger row commit
atomically. CSV import (FR-7) is all-or-nothing: `buildPreview` validates every
row first; `commitImport` throws (writing nothing) if any row has an error.
Hard delete is blocked once a product has an `order_confirmed` / `order_cancelled`
movement — archive instead.

### Order Desk (Phase 3)

| Table | Purpose |
|---|---|
| `customers` | created automatically inside `createOrder` (FR-13). Name, phone and delivery address are **required** to place an order (internal and storefront); `phone` stays nullable in the schema (legacy rows) and dedupes by `(tenant, phone)` when present. |
| `orders` | per-tenant `order_number`, status enum, money columns all snapshot, `stock_committed` flag, plus `delivery_address`, `payment_status` (unpaid/partial/paid) and `amount_paid`. |
| `order_items` | `name_snapshot` + `price_snapshot` + qty + `line_total` — frozen at create/edit time (FR-10). |
| `order_events` | append-only timeline: `kind` ∈ created/status/note/edited (FR-11). |

`lib/orders.ts` is the engine. `lib/money.ts` does all arithmetic in integer
cents. Every write path runs in one `withTenant()` transaction:

- **createOrder** — resolve/create customer → price items from the live catalog →
  allocate order number → insert order + items + `created` event → if `confirm`,
  decrement stock (`order_confirmed` movements) and set `stock_committed`.
- **pipeline** (`advanceOrder` / `moveOrder` / `cancelOrder` / `returnOrder`) —
  legal moves are `MAIN_NEXT[from] === to`, `to === cancelled && from ∈
  {draft…shipped}`, or `to === returned && from === delivered`; anything else
  throws `OrderTransitionError`. The **orders list** has an inline status
  `<select>` per row (`components/orders/order-status-select.tsx` +
  `setOrderStatusAction`) offering exactly `legalMoves(status)` — there is no
  separate board view. Entering Confirmed commits stock; leaving to
  Cancelled/Returned restores what was outstanding.
- **updatePayment** — sets `payment_status` / `amount_paid` from the order
  detail's Payment card; writes a timeline note.
- **editOrder** — owner-only past Draft (FR-12); reprices, and if the order was
  stock-committed it restores then re-commits so the ledger stays correct.

`app/desk/export/[entity]/route.ts` streams CSV for orders / customers /
products (FR-14), tenant-scoped, no support request.

**Stock tracking toggle** (`tenants.stock_tracking_enabled`, set in Settings):
when off, `createOrder` / `transition` skip `commitStock`/`restoreStock` and
leave `stock_committed = false`; the composer and storefront stop showing
"X left" / out-of-stock. `lib/pipeline.ts` holds the transition rules as pure
functions so they're unit-tested without a DB.

### Read API — the website bridge (FR-22)

`app/api/v1/{products,catalog}/route.ts` — public route handlers (Node runtime),
authed by `Authorization: Bearer sd_live_…`. `lib/api-keys.ts` stores only the
SHA-256 of each key (`api_keys` table), resolves the bearer token to a
`tenantId`, and touches `last_used_at`. `lib/public-api.ts` builds the response
(business + categories + products, `in_stock` boolean only — never quantities).
Keys are minted / revoked from **Settings → API access** (owner-only). Full
contract: `docs/api.md`.

### Upgrade banner (FR-23)

`lib/upsell.ts#upsellState` — shows the "ready for a website" banner in the desk
layout once orders ≥ 50, products ≥ 30, or account age ≥ 90 days; dismissible
(`tenants.upsell_dismissed_at`), reappears after 60 days, never blocks.

### Share link (Phase 4)

| Table | Purpose |
|---|---|
| `share_carts` | a public visitor's frozen selection + short reference `code` (unique per tenant), plus their name / phone / address / note. `status` ∈ pending/imported. |

`tenants` gains `accent_color`, `logo_key`, `share_policy_text`,
`storefront_categories` (ordered chip list, null = every distinct category);
`whatsapp_number` is the storefront's contact number (edited here, not in
account settings). `public_page_paused` already existed.

- **Catalog page** `app/s/[slug]/page.tsx` — `getStorefront` returns the catalog
  (stock as in/low/out, never a count), the ordered chip list, and tenant
  presentation. Product tiles link to…
- **Product page** `app/s/[slug]/[id]/page.tsx` — `getStorefrontProduct`: photo
  gallery, full description, add-to-cart.
- **Cart** — `components/share/use-cart.ts` persists to `localStorage` keyed by
  slug so it survives navigating between the two pages.
- **Cart sheet** — `components/share/cart-sheet.tsx`: a bottom-sheet with a cart
  view (per-item steppers + remove, live subtotal) → checkout view (per-field
  inline validation, touched/error states) → sending (spinner) → success
  (reference code + Open WhatsApp). Errors surface in-sheet with retry.
- **Handoff** — `startShareHandoff` (unauthenticated) validates required
  name/phone/address, freezes the cart into `share_carts`, returns a `wa.me`
  deep-link body (with the customer details) + reference code.
- **Import** — `/desk/orders/new?code=XXXX` pre-fills the composer (incl.
  address); `createOrderAction` marks the cart `imported`.
- **Settings** — `app/desk/share/page.tsx`: WhatsApp number, accent colour,
  category-chip picker (reorderable), policy text, pause toggle
  (`saveShareSettings`), copyable link + server-rendered SVG QR (`qrcode`).

## Desk shell (dashboard console)

`app/desk/layout.tsx` is a sidebar + topbar shell (`components/desk/nav.tsx`):
the nav rail and top bar are fixed (`h-[100dvh]` + `overflow-hidden`); only the
content column scrolls. Breadcrumbs + a mobile drawer. `app/desk/page.tsx` is the **Dashboard** — stat tiles
(`lib/dashboard.ts#dashboardMetrics`), pipeline counts, recent orders. The order
list moved to `app/desk/orders/`. Shared packaging (PageHeader / Card / StatCard
/ Table / Btn) lives in `components/desk/ui.tsx`. Palette: teal accent on a warm
off-white workspace, deep-teal nav rail — `app/globals.css`.

Roles: `owner` \| `staff` \| `viewer` (`role` enum). Plan status:
`trialing` \| `active` \| `past_due` \| `read_only` \| `cancelled`.

## Auth flow

1. **Signup** (`app/actions/auth.ts#signup`) → validate, hash password (bcrypt, cost 12), insert user with `passwordChangedAt = now`, `signIn("credentials")`, redirect to `/onboarding/business`.
2. **Business basics** (`app/actions/onboarding.ts`) → create `tenant` + `owner` membership + audit row in one transaction, pick a free slug, set 14-day trial, `updateSession()` to refresh the JWT, redirect to `/desk`.
3. **Login** → password or magic link. Magic link uses the Nodemailer provider; with no SMTP configured the link prints to the server console.
4. **Session** → JWT, 30-day `maxAge`. The `jwt` callback loads the membership (tenantId, tenantSlug, role) and rejects any token whose `iat` predates `users.password_changed_at` (FR-2).

`proxy.ts` gates routes at the edge using only the decoded JWT: no session → `/login`; session but no tenant → `/onboarding/business`; otherwise through.

## Authorization

`lib/rbac.ts` holds the capability matrix from PRD §7.1. Every server action and
route handler that mutates data must call `requireCapability(...)` (or
`assertCan`) **after** resolving `tenantId`. The client is never trusted.
v1 users are all `owner`s in practice; the matrix exists so v1.1 invites are
additive.

## Tenant isolation

Two layers:

1. **Application** — every tenant-scoped query filters by `tenantId` first. Non-negotiable.
2. **Postgres RLS** — `scripts/apply-rls.ts` enables row-level security on every
   tenant table (`tenants`, `memberships`, `audit_log`, `products`,
   `product_photos`, `stock_movements`, `customers`, `orders`, `order_items`,
   `order_events`, `share_carts`). Each policy has a `using` **and** a
   `with check` clause keyed on `current_setting('app.current_tenant')`, so a bug
   can neither read nor write across tenants. `db/tenant.ts#withTenant(tenantId,
   fn)` opens a pooled (WebSocket) transaction, sets that GUC with
   `set_config(..., true)` (transaction-local), and runs `fn`.

**Enforcement:** running `RUNTIME_DB_PASSWORD=… npm run db:rls` once provisions
`app_runtime` — a `LOGIN NOBYPASSRLS` role with only DML privileges — and prints
`DATABASE_URL_RUNTIME`. When that's set, `withTenant()` (every tenant-scoped
*write*: catalog, CSV import, order create/edit/pipeline) runs as `app_runtime`
and is genuinely subject to the policies; verified by a cross-tenant insert being
rejected by Postgres. Onboarding uses the owner role via `pooledDb()` (no tenant
context yet). Tenant-scoped **reads** still use the owner `db` (neon-http, which
can't hold the GUC across its per-statement HTTP requests) with an explicit
`tenantId` filter — the application layer remains the primary guard there;
routing reads through a GUC-scoped pooled client is a follow-up.

## Commands

| Command | What |
|---|---|
| `npm run dev` | local dev server |
| `npm run db:generate` | generate a migration from `db/schema.ts` |
| `npm run db:migrate` | apply migrations to `DATABASE_URL` |
| `npm run db:push` | push schema directly (dev only) |
| `npm run db:rls` | install/refresh RLS policies (`RUNTIME_DB_PASSWORD=…` also provisions `app_runtime`) |
| `npm run db:studio` | Drizzle Studio |
| `npm test` | unit tests (Vitest) |
| `npm run cf:preview` | build + run the Cloudflare Worker locally |
| `npm run cf:deploy` | build + deploy to Cloudflare Workers |
| `npm run typecheck` / `npm run lint` | checks |
