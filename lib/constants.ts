/**
 * Product name. Provisional placeholder — "SFDesk" (storefront + order desk).
 * Override per-environment with the APP_NAME env var. See PRD §14.
 */
export const APP_NAME = process.env.APP_NAME ?? "SFDesk";

/** Starter plan price, billed monthly, in LKR. */
export const PLAN_PRICE_LKR = 1500;

/**
 * Canonical public origin, for links in emails and other places with no
 * request context. `AUTH_URL` is already required by Auth.js.
 */
export function appUrl(path = "/"): string {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
