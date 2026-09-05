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
 * Use `pooledDb` for any multi-statement write that must be atomic but has no
 * tenant context yet (e.g. creating the first tenant + membership).
 *
 * Use `withTenant(tenantId, fn)` for tenant-scoped work: it opens a transaction
 * and sets `app.current_tenant` (transaction-local) so the Postgres RLS policies
 * from `scripts/apply-rls.ts` apply as a second line of defence.
 */

// Node 22+ ships a global WebSocket; wire it up for the serverless driver.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

const connectionString = process.env.DATABASE_URL;

let pool: Pool | undefined;
let client: NeonDatabase<typeof schema> | undefined;

function getClient(): NeonDatabase<typeof schema> {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string (see GUIDE.md).",
    );
  }
  pool ??= new Pool({ connectionString });
  client ??= drizzle(pool, { schema, casing: "snake_case" });
  return client;
}

/** Lazily-created pooled client. Access via the getter so it isn't built at import time. */
export function pooledDb(): NeonDatabase<typeof schema> {
  return getClient();
}

type Tx = Parameters<Parameters<NeonDatabase<typeof schema>["transaction"]>[0]>[0];

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return getClient().transaction(async (tx) => {
    // set_config(name, value, is_local=true) — scoped to this transaction only.
    await tx.execute(sql`select set_config('app.current_tenant', ${tenantId}, true)`);
    return fn(tx);
  });
}

export type { Tx };
