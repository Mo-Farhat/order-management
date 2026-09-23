import type { NextConfig } from "next";

/**
 * Storefront pages carry nothing user-specific — the cart lives in
 * localStorage — so the rendered HTML is identical for every visitor and can
 * sit on Cloudflare's edge. That is what keeps a busy shop off the Worker
 * (and off Postgres) entirely: `s-maxage` serves repeat visitors from cache,
 * and `stale-while-revalidate` means the one request that finds it expired
 * still gets an instant response while the refresh happens behind it.
 *
 * 60s is deliberately short: a seller who edits a price expects to see it, and
 * `updateTag` can clear our own data cache but not Cloudflare's edge copy.
 *
 * Desk routes are never listed here — they are per-tenant and must not be
 * shared. `/desk`, `/admin` and the API stay uncached by default.
 */
const STOREFRONT_CACHE =
  "public, s-maxage=60, stale-while-revalidate=300, must-revalidate";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/s/:slug",
        headers: [{ key: "Cache-Control", value: STOREFRONT_CACHE }],
      },
      {
        source: "/s/:slug/:id",
        headers: [{ key: "Cache-Control", value: STOREFRONT_CACHE }],
      },
    ];
  },
};

export default nextConfig;
