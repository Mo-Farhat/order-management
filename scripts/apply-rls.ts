/**
 * Installs Postgres row-level security as the second line of tenant isolation
 * (NFR "multi-tenant isolation"). Run after `npm run db:migrate`:
 *
 *   npm run db:rls
 *
 * Each policy keys off `current_setting('app.current_tenant', true)`, the GUC
 * that `db/tenant.ts#withTenant` sets per transaction.
 *
 * Phase 1 caveat: the connection string in DATABASE_URL is the Neon owner role,
 * which owns these tables and therefore *bypasses* RLS unless FORCE is on. We do
 * not FORCE yet because onboarding (create tenant + first membership + audit row)
 * legitimately runs before any tenant context exists. Phase 2 introduces a
 * restricted runtime role for product/order/customer tables, where RLS becomes
 * load-bearing and FORCE is enabled. Policies are installed now so that step is
 * additive, not a retrofit.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — see GUIDE.md.");
  process.exit(1);
}

const sql = neon(url);

const STATEMENTS: string[] = [
  // tenants: a row is visible only when it is the active tenant.
  `alter table tenants enable row level security`,
  `drop policy if exists tenant_isolation on tenants`,
  `create policy tenant_isolation on tenants
     using (
       current_setting('app.current_tenant', true) is null
       or current_setting('app.current_tenant', true) = ''
       or id = current_setting('app.current_tenant', true)::uuid
     )`,

  // memberships: scoped by tenant_id.
  `alter table memberships enable row level security`,
  `drop policy if exists tenant_isolation on memberships`,
  `create policy tenant_isolation on memberships
     using (
       current_setting('app.current_tenant', true) is null
       or current_setting('app.current_tenant', true) = ''
       or tenant_id = current_setting('app.current_tenant', true)::uuid
     )`,

  // audit_log: scoped by tenant_id (null tenant_id rows are system events).
  `alter table audit_log enable row level security`,
  `drop policy if exists tenant_isolation on audit_log`,
  `create policy tenant_isolation on audit_log
     using (
       current_setting('app.current_tenant', true) is null
       or current_setting('app.current_tenant', true) = ''
       or tenant_id = current_setting('app.current_tenant', true)::uuid
     )`,

  // Catalog tables (Phase 2) — all scoped by tenant_id.
  ...["products", "product_photos", "stock_movements"].flatMap((table) => [
    `alter table ${table} enable row level security`,
    `drop policy if exists tenant_isolation on ${table}`,
    `create policy tenant_isolation on ${table}
       using (
         current_setting('app.current_tenant', true) is null
         or current_setting('app.current_tenant', true) = ''
         or tenant_id = current_setting('app.current_tenant', true)::uuid
       )`,
  ]),
];

async function main() {
  for (const stmt of STATEMENTS) {
    process.stdout.write(`· ${stmt.split("\n")[0].trim()} … `);
    await sql.query(stmt);
    console.log("ok");
  }
  console.log("\nRLS policies installed.");
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
