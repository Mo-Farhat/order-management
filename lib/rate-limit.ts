import "server-only";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import { db } from "@/db";

/**
 * Fixed-window rate limiter backed by one Postgres row per key. Good enough for
 * launch-scale abuse control on the unauthenticated public endpoints; swap for
 * Cloudflare's edge rate-limiting rules if volume grows.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  // Atomic upsert: increment within the current window, reset on a new one.
  const ws = windowStart.toISOString();
  const result = await db.execute(sql`
    insert into rate_limits (key, count, window_start)
    values (${key}, 1, ${ws})
    on conflict (key) do update set
      count = case when rate_limits.window_start = ${ws}
                   then rate_limits.count + 1 else 1 end,
      window_start = ${ws}
    returning count
  `);
  const count = Number(result.rows[0]?.count ?? 1);

  const ok = count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - count),
    retryAfter: ok ? 0 : Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000),
  };
}

/** Best-effort client IP for keying limits (Cloudflare → x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/** Same, from a raw Request (route handlers). */
export function clientIpFrom(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
