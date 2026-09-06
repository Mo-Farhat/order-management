import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers adapter config.
 * Docs: https://opennext.js.org/cloudflare
 *
 * Kept minimal: no incremental cache / tag store wired yet (the app has no ISR —
 * every desk route is `dynamic`). Add an R2/KV cache here later if needed.
 */
export default defineCloudflareConfig({});
