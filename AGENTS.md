<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project

Order-and-catalog SaaS for DM-based sellers. Read `docs/PRD.md` first, then
`docs/architecture.md`. Screen specs in `docs/ux/`.

## Stack conventions

- **Next.js 16 App Router.** Route protection is `proxy.ts` (the renamed
  `middleware`). Server Actions for mutations, not route handlers.
- **Drizzle ORM + Neon Postgres.** No Prisma. Schema is `db/schema.ts` — the
  single source of DB truth; change it, then `npm run db:generate`.
- **`db` (`db/index.ts`)** is neon-http, for auth and non-tenant queries.
  **Tenant-scoped data goes through `withTenant()` (`db/tenant.ts`)** so RLS
  applies.
- **Auth.js v5**, JWT sessions. Full config `auth.ts` (Node), edge subset
  `auth.config.ts` (used by `proxy.ts` — keep it free of DB/bcrypt imports).
- **Every mutation** resolves `tenantId` first, then calls
  `requireCapability()` / `assertCan()` from `lib/rbac.ts`. Never trust the client.
- `design/` is imported reference material — excluded from lint/tsc, don't edit.
- Product name is a placeholder (`lib/constants.ts` / `APP_NAME`) — see PRD §14.
