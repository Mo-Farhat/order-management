/**
 * Product name. Provisional placeholder — "SFDesk" (storefront + order desk).
 * Override per-environment with the APP_NAME env var. See PRD §14.
 */
export const APP_NAME = process.env.APP_NAME ?? "SFDesk";

/** Starter plan price, billed monthly, in LKR. */
export const PLAN_PRICE_LKR = 1500;
