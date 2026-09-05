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
  desk/                  the authed app                 (auth + tenant)
    layout.tsx           header + tab nav + CSV export links
    page.tsx             order list (status tabs, search)
    orders/              new-order flow, [id] detail, [id]/edit
    board/               pipeline board (tap-to-advance)
    catalog/             product list, new, [id] edit, import
    export/[entity]/     CSV download route handler
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
  rbac.ts                capability matrix + can()/assertCan()
  session.ts             requireUser / requireActive / requireCapability
  validation.ts          zod schemas
  email.ts               magic-link sender (console in dev)
  catalog.ts             product CRUD + stock ledger (server-only)
  csv-import.ts          CSV parse / preview / all-or-nothing commit
  storage.ts             R2 upload (no-op + UI hidden when unconfigured)
drizzle/                 generated migrations
scripts/apply-rls.ts     installs row-level security policies
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
| `product_photos` | up to 6 per product; stores the R2 object `key`, public URL derived at read time. |
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
| `customers` | one row per `(tenant, phone)`. Created/updated automatically inside `createOrder` — no standalone add flow (FR-13). |
| `orders` | per-tenant `order_number` (from `tenants.next_order_number`), status enum, money columns all snapshot, `stock_committed` flag. |
| `order_items` | `name_snapshot` + `price_snapshot` + qty + `line_total` — frozen at create/edit time (FR-10). |
| `order_events` | append-only timeline: `kind` ∈ created/status/note/edited (FR-11). |

`lib/orders.ts` is the engine. `lib/money.ts` does all arithmetic in integer
cents. Every write path runs in one `withTenant()` transaction:

- **createOrder** — resolve/create customer → price items from the live catalog →
  allocate order number → insert order + items + `created` event → if `confirm`,
  decrement stock (`order_confirmed` movements) and set `stock_committed`.
- **pipeline** (`advanceOrder` / `cancelOrder` / `returnOrder`) — the only legal
  moves are `MAIN_NEXT[from] === to`, `to === cancelled && from ∈ {draft…shipped}`,
  or `to === returned && from === delivered`. Anything else throws
  `OrderTransitionError`. Entering Confirmed commits stock; leaving to
  Cancelled/Returned restores exactly what was outstanding (nets committed vs.
  already-restored movements).
- **editOrder** — owner-only past Draft (FR-12); reprices, and if the order was
  stock-committed it restores then re-commits so the ledger stays correct.

`app/desk/export/[entity]/route.ts` streams CSV for orders / customers /
products (FR-14), tenant-scoped, no support request.

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
2. **Postgres RLS** — `scripts/apply-rls.ts` enables row-level security on `tenants`, `memberships`, `audit_log` with policies matching `current_setting('app.current_tenant')`. `db/tenant.ts#withTenant(tenantId, fn)` opens a pooled (WebSocket) connection, sets that GUC with `set_config(..., true)` (transaction-local), and runs `fn`.

**Phase 1 caveat:** `DATABASE_URL` is the Neon owner role, which owns the tables
and bypasses non-forced RLS. Policies are installed now so Phase 2 — which adds a
restricted runtime role and `FORCE ROW LEVEL SECURITY` on `products` / `orders` /
`customers` / `stock_movements` — is additive rather than a retrofit. Until then,
RLS is a latent safety net, and the application layer is the real guard.

## Commands

| Command | What |
|---|---|
| `npm run dev` | local dev server |
| `npm run db:generate` | generate a migration from `db/schema.ts` |
| `npm run db:migrate` | apply migrations to `DATABASE_URL` |
| `npm run db:push` | push schema directly (dev only) |
| `npm run db:rls` | install/refresh RLS policies |
| `npm run db:studio` | Drizzle Studio |
| `npm run typecheck` / `npm run lint` | checks |
