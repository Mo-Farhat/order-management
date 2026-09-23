import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * OpenNext → Cloudflare Workers adapter config.
 * Docs: https://opennext.js.org/cloudflare
 *
 * The storefront reads in `lib/share.ts` are wrapped in `unstable_cache` and
 * invalidated per shop with `updateTag`. On Workers that only survives between
 * requests if the adapter has somewhere to put it, so:
 *
 *   - incremental cache → R2   (the cached payloads themselves)
 *   - tag cache         → D1   (which tags are stale; strongly consistent, so a
 *                               seller who edits their shop sees it at once —
 *                               KV's eventual consistency would not do here,
 *                               because stock reaching zero must not go stale)
 *
 * Both need resources + bindings before `npm run cf:deploy` — see GUIDE.md
 * step 4c. Without them the deploy fails at startup on the missing binding.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
});
