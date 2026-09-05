# Storefront Desk *(placeholder name — see PRD §14)*

An order-and-catalog tool for owner-run SMEs who take orders through Instagram
DMs and WhatsApp. Replaces that mess with a catalog and an order pipeline,
mobile-first, self-serve.

- **Product spec:** [`docs/PRD.md`](docs/PRD.md)
- **Screen specs:** [`docs/ux/`](docs/ux/)
- **Architecture:** [`docs/architecture.md`](docs/architecture.md)
- **Setup & API keys:** [`GUIDE.md`](GUIDE.md)
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

**Phase 1** (schema, tenancy, auth, RBAC skeleton) — in progress. See PRD §11 for
the rollout plan.

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
| `npm run db:rls` | install row-level security policies |
| `npm run db:studio` | Drizzle Studio |
