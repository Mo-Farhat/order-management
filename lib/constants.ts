/**
 * Product name. Provisional — "Pola" (Sinhala for a market / weekly fair: the
 * place sellers set up and customers come to them). Override per-environment
 * with the APP_NAME env var. See PRD §14 "Open decisions".
 */
export const APP_NAME = process.env.APP_NAME ?? "Pola";

/** Starter plan price, billed monthly, in LKR. */
export const PLAN_PRICE_LKR = 1500;
