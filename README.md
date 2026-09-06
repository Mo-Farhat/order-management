# Storefront Desk *(placeholder name — see PRD §14)*

An order-and-catalog tool for owner-run SMEs who take orders through Instagram
DMs and WhatsApp. Replaces that mess with a catalog and an order pipeline,
mobile-first, self-serve.

- **Product spec:** [`docs/PRD.md`](docs/PRD.md)
- **Screen specs:** [`docs/ux/`](docs/ux/)
- **Architecture:** [`docs/architecture.md`](docs/architecture.md)
- **Read API (website bridge):** [`docs/api.md`](docs/api.md)
- **Setup, deploy & API keys:** [`GUIDE.md`](GUIDE.md)
- **Visual exploration:** `design/` (Claude Design canvas — direction only)

## Stack

Next.js 16 (App Router) · Drizzle ORM · Neon Postgres · Auth.js v5 · Cloudflare
(R2 + hosting). No Prisma.

## Getting started

```bash
npm install
cp .env.example .env.local     # add your Neon DATABASE_URL — see GUIDE.md
npm run db:migrate
npm run db:rls
npm run dev
```

Open <http://localhost:3000>. With no email server configured, magic-link sign-in
URLs print to the dev-server console.

## Status

- **Phase 1** — schema, tenancy, auth, RBAC skeleton ✅
- **Phase 2** — catalog (products, stock ledger, CSV import; photos pending R2) ✅
- **Phase 3** — order desk (customers, order flow, pipeline, board, CSV export) ✅
- **Phase 4** — public share link (storefront, WhatsApp handoff, QR, pause) ✅
- **Phase 6** — read API (FR-22) + upgrade banner (FR-23) ✅
- **Phase 5** — billing — next

The desk is a sidebar-nav console: **Dashboard** (metrics + recent orders),
Orders, Pipeline board, Catalog, Storefront, Settings. Teal palette, tuned
against the OrderCast reference.

Product photos go to **Cloudflare R2** (S3-compatible, signed with a tiny SigV4
helper — no AWS SDK; GUIDE.md step 4a). Postgres RLS is enforced on the write
path once the `app_runtime` role is provisioned (GUIDE.md step 1a). Deploy target
is Cloudflare Workers via `@opennextjs/cloudflare` (GUIDE.md step 4b).

See PRD §11 for the full rollout plan.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint |
| `npm run db:generate` | generate migration from schema |
| `npm run db:migrate` | apply migrations |
| `npm run db:push` | push schema (dev only) |
| `npm run db:rls` | install RLS policies (+ provision `app_runtime` with `RUNTIME_DB_PASSWORD=…`) |
| `npm run db:studio` | Drizzle Studio |
| `npm test` | unit tests (Vitest) |
| `npm run cf:preview` / `cf:deploy` | Cloudflare Workers preview / deploy |
