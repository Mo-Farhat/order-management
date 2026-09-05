# PRD: Storefront Desk *(working name — rename before merge, see Open Decisions)*

**Status:** Draft, pre-build
**Owner:** Mohamed Farhat (solo build)
**Last updated:** 2026-09-05
**Repo placement:** `/docs/PRD.md`

> **Build note (2026-09-05):** Phase 1 (schema, tenancy, auth, RBAC skeleton) is
> in progress. Stack decisions in §9 are now resolved. Setup and key handover:
> see `/GUIDE.md`. Architecture detail: see `/docs/architecture.md`.
> Product name remains a placeholder ("Storefront Desk") — see §14.

---

## 1. Summary

Storefront Desk is a subscription tool for owner-run SMEs (starting with e-commerce sellers) who currently take orders through Instagram DMs and WhatsApp and have no system for tracking them. It replaces that mess with a catalog and an order pipeline, priced at roughly 1/20th of a custom website, self-serve from signup to cancellation.

It is being built and marketed as its own product, not a Forty Pixels service line. Forty Pixels is an initial distribution channel and, for FP's own clients, an upgrade path: the product's data model is designed so a website (built by any agency, not exclusively Forty Pixels) can consume it directly.

## 2. Problem statement

Local SME sellers running e-commerce through social DMs lose orders, lose track of stock, and can't afford or don't yet need a full website. Existing options force a false choice: manual chaos, or a website project priced and scoped for a business twice their size. There is no cheap, correctly-scoped middle step — and no path from that middle step to a website that doesn't mean starting over.

## 3. Goals

- Give an owner a working order-and-catalog system they can operate from a phone, one-handed, mid-conversation with a customer.
- Make the tool cheap enough that budget is never the objection.
- Make the eventual website upgrade a data migration of zero, not a rebuild.
- Build something a solo developer can actually maintain: one workflow, no per-client forks, no bespoke configuration per account.

## 4. Non-goals

- Not a full e-commerce platform. No payment processing, ever (see §11 of the earlier spec — carried forward here as a permanent constraint, not a v1 cut).
- Not a custom solution per client. See §5 Product Principles — this is the load-bearing constraint on the whole build.
- Not competing on features with Shopify-class tools. Competing on being scoped correctly for a business that doesn't need Shopify.
- Not an agency retainer product. Support is self-serve; anything requiring a human per account breaks the economics.

## 5. Product principles (non-negotiable)

These exist because the founder is aware of the failure mode and is writing it down before it happens.

1. **No forks.** If one client needs a fix, it goes in a request list. It ships to everyone or it doesn't ship. It never ships for one account.
2. **Configuration over customisation.** Where variation is real and expected (currency, whether stock tracking is on, delivery fee defaults), it's a setting every tenant has from day one. Where it isn't yet known to be real, ship the opinion — don't build a setting speculatively.
3. **The free-text note field is the pressure valve.** Edge cases that don't justify a feature go in a note, not a schema change.
4. **Every tenant runs the same code.** Single codebase, single deploy, `tenant_id` scoping — never a per-client branch or config file.

Any feature request that violates #1 gets rejected in the onboarding email's own words, set at signup, so it isn't a surprise later: *"We build one system for everyone — if you hit something that doesn't fit, tell us, and if enough people hit the same thing, it becomes a real feature."*

## 6. Users

| Role | Description | v1 UI needed? |
|---|---|---|
| Owner | Runs the business, only user in most accounts at launch | Yes |
| Staff | Packer/assistant, works orders | Deferred — spec exists, not built until an account asks |
| Viewer | Read-only (accountant, family) | Deferred |
| Customer (end buyer) | Never logs in; interacts only via the public share-link page | Yes (public page only) |

v1 ships single-user-per-account. Multi-user RBAC is fully specced (§7) so it isn't a rearchitecture later, but the invite/role UI is not built until real demand appears — consistent with Product Principle #2.

## 7. Functional requirements

Each item has acceptance criteria. Anything not listed here is out of scope — see §12.

### 7.1 Auth
- **FR-1:** User can sign up with email + password or request a magic link. *AC: account created, session issued, redirected to business-basics step.*
- **FR-2:** Session persists 30 days, invalidated on password change. *AC: changing password from settings signs out all other sessions.*
- **FR-3 (deferred to v1.1):** Owner can invite Staff/Viewer users by email with a role attached. Full RBAC model below is the target schema even though the invite UI ships later.

**RBAC matrix (target, schema built now, UI phased):**

| Capability | Owner | Staff | Viewer |
|---|:--:|:--:|:--:|
| Edit catalog | ✓ | ✓ | — |
| Delete product | ✓ | — | — |
| Create/advance order | ✓ | ✓ | — |
| Edit order past Confirmed | ✓ | — | — |
| View-only access | ✓ | ✓ | ✓ |
| Billing | ✓ | — | — |

Enforcement is server-side on every mutation, filtered by `tenant_id` before any other predicate. No exceptions, including for internal support access (impersonation only, time-boxed, logged, visible to the Owner).

### 7.2 Catalog
- **FR-4:** Owner can create a product with name, price, stock quantity, and up to 6 photos. *AC: product appears in list and on the public share-link page within one save action.*
- **FR-5:** Stock decrements automatically on order confirmation, restores on cancellation. *AC: verified by a StockMovement audit row per change, attributing actor and reason.*
- **FR-6:** Owner can archive (not hard-delete) a product that has order history. *AC: archived products disappear from the public page and new-order grid, remain visible in historical orders, delete button disabled with an inline explanation if order history exists.*
- **FR-7:** Owner can bulk import products via CSV with a preview-before-commit step. *AC: no partial imports — either the whole batch commits or none does.*
- No variants in v1 (Product Principle #2 — ship the opinion; add if multiple accounts ask).

### 7.3 Order Desk
- **FR-8:** Owner or Staff can create an order in under 5 taps: find/add customer → select items → confirm. *AC: measured via analytics event timestamps, target median under 30 seconds.*
- **FR-9:** Orders move through a fixed pipeline: Draft → Confirmed → Packed → Shipped → Delivered, with Cancelled and Returned as branches. *AC: pipeline is not configurable in the UI — this is intentional, not a missing feature.*
- **FR-10:** Line items snapshot product name and price at order creation. *AC: editing a product's price after the fact does not alter any existing order's total.*
- **FR-11:** Every status change is timestamped and attributed to a user. *AC: visible in the order's timeline view.*
- **FR-12:** Orders past Confirmed can only be edited by the Owner. *AC: Staff sees the fields but cannot submit changes; server rejects the mutation regardless of client-side state.*

### 7.4 Customers
- **FR-13:** Customer records are created automatically from orders, keyed on phone number within a tenant. *AC: no separate "add customer" flow required to place a first order.*
- **FR-14:** Owner can export customers, products, and orders as CSV at any time. *AC: no support request needed; self-serve download completes without human involvement.*

### 7.5 Share link
- **FR-15:** Every tenant gets a public page at `desk.<domain>/{slug}` showing their live catalog. *AC: reflects catalog changes in real time (or near-real-time, cache-invalidated on save).*
- **FR-16:** Customers can select items and hand off to WhatsApp with a pre-filled message and reference code. *AC: message includes item names, quantities, subtotal, and a code the owner can locate in Order Desk to convert into a Draft order.*
- **FR-17:** No payment or checkout happens on this page. *AC: there is no payment field, gateway integration, or amount-collection UI anywhere in this flow, by design, permanently.*
- **FR-18:** Owner can pause the public page. *AC: paused state shows a static "not taking orders right now" message instead of the catalog.*

### 7.6 Self-serve billing
- **FR-19:** 14-day trial, no card required. *AC: full feature access during trial, card requested only at conversion.*
- **FR-20:** Owner can upgrade, downgrade, pause (up to 3 months), or cancel without contacting support. *AC: every action completes from the billing settings screen.*
- **FR-21:** Failed payment triggers retries at day 1/3/7, account goes read-only at day 10, data retained 90 days post read-only. *AC: verified against a test dunning schedule before launch.*

### 7.7 Upgrade-to-website bridge
- **FR-22:** Tenant can generate a scoped, revocable read API key exposing `/api/v1/products` and `/api/v1/catalog`. *AC: any external frontend (Forty Pixels' or another agency's) can render a storefront from this API without touching the Order Desk database directly.*
- **FR-23:** In-product upsell banner triggers on usage thresholds (50+ orders, 30+ products, or 90 days active). *AC: dismissible, reappears after 60 days, never blocks a workflow.*

## 8. Non-functional requirements

- **Mobile-first, one-handed use.** Primary device is a mid-range Android phone on a patchy connection — this governs every layout decision, not just the public page.
- **Offline order queue.** Order creation queues locally and syncs on reconnect. Not optional for the target market.
- **Multi-tenant isolation.** Every table carries `tenant_id`; enforced at the data-access layer plus Postgres row-level security as a second line of defence.
- **Auditability.** Every mutation logged with actor, before/after, timestamp; retained 12 months.
- **Backups.** Daily automated, 30-day retention, quarterly restore test.
- **Solo-maintainable.** No infrastructure requiring a dedicated on-call rotation, no per-tenant deploys, no manual steps in onboarding.

## 9. Tech stack

Next.js 16 (App Router) + TypeScript, PWA (not native).

Resolved during Phase 1 build (2026-09-05):

| Area | Choice | Notes |
|---|---|---|
| Database | **Neon** (serverless Postgres) | Pooled connection string; single region nearest Sri Lanka. |
| ORM / migrations | **Drizzle ORM** + drizzle-kit | Prisma explicitly rejected by the owner. `casing: "snake_case"`. |
| Auth | **Auth.js v5** (`next-auth@beta`) | Credentials (email + password) and Nodemailer magic link. JWT session strategy (Credentials requires it), 30-day expiry, invalidated when `passwordChangedAt` moves past the token's `iat` (FR-2). Drizzle adapter. No per-MAU cost. |
| Object storage + CDN | **Cloudflare R2** | Not wired until Phase 2 (catalog photos). |
| Hosting | **Cloudflare** free tier (Pages / Workers) | Target; not yet deployed. |
| Tenant isolation | App-layer `tenantId` scoping + Postgres RLS | RLS policies key off `current_setting('app.current_tenant')`, set per-transaction by `db/tenant.ts#withTenant`. See §8 and `docs/architecture.md`. |

Route protection uses Next 16's `proxy.ts` (the renamed `middleware` convention).

## 10. Success metrics

| Metric | Target | Why it's the metric |
|---|---|---|
| Committed pilot businesses before build starts | 5 | Validation gate — see §13 |
| Active accounts at month 3 post-launch | 20+ | Solo break-even floor (covers hosting + support time) |
| Website conversions per 10 active accounts / year | 1.0 | This is a lead-generation product for the upgrade path, not a standalone SaaS bet — this is the metric that justifies the build even if MRR alone doesn't |
| Median time to create an order | <30s | Core usability bar (FR-8) |
| 90-day retention | tracked, no target set pre-launch | Insufficient data to set a target yet |

**Explicitly not the primary metric:** MRR growth rate. Optimising for it risks tiering, upsells, or feature creep that compromise the "stupidly simple" constraint.

## 11. Rollout plan

| Phase | Contents | Est. (solo) |
|---|---|---|
| 0 | Validation — 5 committed pilot businesses, written | before any code |
| 1 | Schema, tenancy, auth, RBAC skeleton | ~2 weeks |
| 2 | Catalog (FR-4–7) | ~3 weeks |
| 3 | Order Desk (FR-8–14) | ~3 weeks |
| 4 | Share link (FR-15–18) | ~2 weeks |
| 5 | Self-serve billing (FR-19–21) | ~2 weeks |
| 6 | Upgrade bridge API (FR-22–23), polish, offline queue | ~2 weeks |

Solo, part-time alongside existing FP/Inubzee/Ads work — treat estimates as a floor. Do not start Phase 4 until Phase 2–3 are in daily use by at least the 5 pilot businesses.

## 12. Out of scope (permanent, not just v1)

Payment processing, accounting/tax reports, multi-warehouse inventory, purchase orders/supplier management, marketing/campaign tools, configurable pipelines or custom roles, native mobile apps, third-party public API, Instagram/WhatsApp Business API auto-import.

## 13. Validation gate

Before Phase 1 begins: 5 owner-run SMEs committed in writing to use it free for 60 days, at least 3 confirming the price band verbally, and 1 agreeing to be filmed using their current (manual) process for content. If 5 can't be found, the problem is demand, not product — build waits.

## 14. Open decisions

These are unresolved and should not be assumed by anyone reading this PRD:

- **Product name.** "Storefront Desk" is a placeholder used throughout planning docs. Needs a real name and domain before public content or signup begins.
- **Pivot trigger.** If active accounts don't reach ~20 within 6 months of launch, does the product fold back into a Forty Pixels-only lead magnet, or get killed? Not yet decided — decide before month 5, not during it.
- **Single-tier pricing.** Currently planned as one price, one feature set, up to 5 users / 500 products. Revisit only after real usage data — not a pre-launch decision to relitigate.

## 15. Related documents

- `docs/ux/00-scope-overview.md` and `docs/ux/01`–`04` — screen-level UX specs
- `design/Storefront Desk Mockups.dc.html` — exploratory Claude Design canvas (visual direction only, not a spec); `design/_ds/**` is its imported design system
- `docs/architecture.md` — data model, tenancy, auth, and RBAC implementation notes
- `GUIDE.md` — environment setup and the list of API keys / Cloudflare config to provide
- Original full spec (`forty-pixels-storefront-desk-spec.md`) — superset reference for RBAC detail, data model, and technical outline not fully repeated here