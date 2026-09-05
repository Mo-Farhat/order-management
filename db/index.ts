import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string (see GUIDE.md).",
  );
}

const sql = neon(connectionString);

/**
 * neon-http client: one HTTP request per statement, fast, stateless.
 * It has NO transaction support — for atomic multi-statement writes use
 * `pooledDb()` or `withTenant()` from `db/tenant.ts`.
 */
export const db = drizzle(sql, { schema, casing: "snake_case" });

export { schema };
