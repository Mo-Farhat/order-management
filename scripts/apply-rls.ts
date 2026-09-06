/**
 * Installs Postgres row-level security — the second line of tenant isolation
 * (NFR "multi-tenant isolation"). Run after `npm run db:migrate`:
 *
 *   npm run db:rls
 *
 * Each policy keys off `current_setting('app.current_tenant', true)`, the GUC
 * that `db/tenant.ts#withTenant` sets per transaction. Policies carry both a
 * `using` clause (what rows are visible) and a `with check` clause (what rows
 * may be written) so a bug can't insert or move a row into another tenant.
 *
 * ## Making RLS load-bearing (not just latent)
 *
 * The Neon owner role in DATABASE_URL owns these tables and BYPASSES RLS. To
 * actually enforce it, run this script once with RUNTIME_DB_PASSWORD set:
 *
 *   RUNTIME_DB_PASSWORD='a-strong-password' npm run db:rls
 *
 * That provisions `app_runtime` — a LOGIN role with NOBYPASSRLS and only
 * SELECT/INSERT/UPDATE/DELETE — and prints the connection string to put in
 * DATABASE_URL_RUNTIME. `withTenant()` then runs every tenant-scoped write as
 * that role, subject to the policies below. Onboarding (no tenant yet) still
 * uses the owner role via `pooledDb()`.
 *
 * Tenant-scoped *reads* still go through the owner `db` (neon-http) with an
 * explicit tenantId filter — the application layer remains the primary guard.
 * Routing reads through the runtime role too is a follow-up.
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
const DATABASE_URL: string = url;

const runtimePassword = process.env.RUNTIME_DB_PASSWORD;
const sql = neon(url);

const dbName = (() => {
  try {
    return new URL(DATABASE_URL).pathname.replace(/^\//, "").split("?")[0] || "neondb";
  } catch {
    return "neondb";
  }
})();

const TENANT_TABLES = [
  "products",
  "product_photos",
  "stock_movements",
  "customers",
  "orders",
  "order_items",
  "order_events",
  "share_carts",
];

const scoped = (col: string) => `(
  current_setting('app.current_tenant', true) is null
  or current_setting('app.current_tenant', true) = ''
  or ${col} = current_setting('app.current_tenant', true)::uuid
)`;

function policyFor(table: string, col: string): string[] {
  return [
    `alter table ${table} enable row level security`,
    `drop policy if exists tenant_isolation on ${table}`,
    `create policy tenant_isolation on ${table}
       using ${scoped(col)}
       with check ${scoped(col)}`,
  ];
}

const STATEMENTS: string[] = [
  ...policyFor("tenants", "id"),
  ...policyFor("memberships", "tenant_id"),
  ...policyFor("audit_log", "tenant_id"),
  ...TENANT_TABLES.flatMap((t) => policyFor(t, "tenant_id")),
];

const RUNTIME_ROLE_STATEMENTS = (pw: string): string[] => [
  `do $$
   begin
     if not exists (select from pg_roles where rolname = 'app_runtime') then
       create role app_runtime login noinherit nobypassrls password ${literal(pw)};
     else
       alter role app_runtime login noinherit nobypassrls password ${literal(pw)};
     end if;
   end $$`,
  `grant connect on database "${dbName}" to app_runtime`,
  `grant usage on schema public to app_runtime`,
  `grant select, insert, update, delete on all tables in schema public to app_runtime`,
  `grant usage, select on all sequences in schema public to app_runtime`,
  `alter default privileges in schema public grant select, insert, update, delete on tables to app_runtime`,
  `alter default privileges in schema public grant usage, select on sequences to app_runtime`,
];

function literal(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
  for (const stmt of STATEMENTS) {
    process.stdout.write(`· ${stmt.split("\n")[0].trim()} … `);
    await sql.query(stmt);
    console.log("ok");
  }

  if (runtimePassword) {
    console.log("\nProvisioning the app_runtime role …");
    for (const stmt of RUNTIME_ROLE_STATEMENTS(runtimePassword)) {
      process.stdout.write(`· ${stmt.split("\n")[0].trim().replace(literal(runtimePassword), "'***'")} … `);
      await sql.query(stmt);
      console.log("ok");
    }
    const runtimeUrl = DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, `//app_runtime:${encodeURIComponent(runtimePassword)}@`);
    console.log("\napp_runtime provisioned. Put this in .env.local:\n");
    console.log(`DATABASE_URL_RUNTIME="${runtimeUrl}"\n`);
  } else {
    console.log(
      "\nRLS policies installed (latent — the owner role bypasses them).",
      "\nRun once with RUNTIME_DB_PASSWORD=... to provision the enforcing role.",
    );
  }
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
