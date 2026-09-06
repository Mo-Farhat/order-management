import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Pooled (WebSocket) database access — the only path that supports real
 * transactions. The default `db` export (`db/index.ts`) is neon-http, which
 * issues each statement as a separate HTTP request and has NO transaction
 * support ("No transactions support in neon-http driver").
 *
 * Two clients:
 * - `pooledDb()` connects as DATABASE_URL (the Neon owner role). Used for
 *   multi-statement writes with no tenant context yet — onboarding's
 *   create-tenant-plus-membership.
 * - `withTenant(tenantId, fn)` connects as DATABASE_URL_RUNTIME when set — a
 *   restricted `NOBYPASSRLS` role (see scripts/apply-rls.ts). It opens a
 *   transaction, sets `app.current_tenant`, and every statement inside is then
 *   subject to the Postgres RLS policies. Falls back to DATABASE_URL if the
 *   runtime role hasn't been provisioned yet.
 */

// Node 22+ ships a global WebSocket; wire it up for the serverless driver.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

const ownerUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.DATABASE_URL_RUNTIME || process.env.DATABASE_URL;

let ownerPool: Pool | undefined;
let ownerClient: NeonDatabase<typeof schema> | undefined;
let runtimePool: Pool | undefined;
let runtimeClient: NeonDatabase<typeof schema> | undefined;

function missing(): never {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string (see GUIDE.md).",
  );
}

function getOwnerClient(): NeonDatabase<typeof schema> {
  if (!ownerUrl) missing();
  ownerPool ??= new Pool({ connectionString: ownerUrl });
  ownerClient ??= drizzle(ownerPool, { schema, casing: "snake_case" });
  return ownerClient;
}

function getRuntimeClient(): NeonDatabase<typeof schema> {
  if (!runtimeUrl) missing();
  if (runtimeUrl === ownerUrl) return getOwnerClient();
  runtimePool ??= new Pool({ connectionString: runtimeUrl });
  runtimeClient ??= drizzle(runtimePool, { schema, casing: "snake_case" });
  return runtimeClient;
}

/** Owner-role pooled client. Use only where there is no tenant context yet. */
export function pooledDb(): NeonDatabase<typeof schema> {
  return getOwnerClient();
}

type Tx = Parameters<Parameters<NeonDatabase<typeof schema>["transaction"]>[0]>[0];

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return getRuntimeClient().transaction(async (tx) => {
    // set_config(name, value, is_local=true) — scoped to this transaction only.
    await tx.execute(sql`select set_config('app.current_tenant', ${tenantId}, true)`);
    return fn(tx);
  });
}

export type { Tx };
