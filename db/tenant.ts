import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Tenant-scoped database access.
 *
 * The primary isolation mechanism is application code: every tenant table is
 * queried with `tenantId` as the first predicate. As a second line of defence
 * (NFR "multi-tenant isolation"), Postgres row-level security policies key off
 * `current_setting('app.current_tenant')`. Those policies only take effect
 * inside a transaction that has set that GUC, which is what `withTenant` does.
 *
 * neon-http (the default `db` export) issues each statement as a separate HTTP
 * request and cannot hold `SET LOCAL` state, so tenant-scoped work uses a
 * pooled WebSocket connection instead.
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
