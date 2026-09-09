import type { PlanTier } from "@/db/schema";
import { PLAN_PRICE_LKR } from "@/lib/constants";

/**
 * Marketing-facing plan tiers. Single source of truth for the pricing page.
 * `priceLKR: null` = "coming soon" (founder fills the number before launch).
 * Feature copy is deliberately customer-language, not the internal
 * `STOREFRONT_FEATURES` slugs.
 */
export type Tier = {
  key: PlanTier;
  name: string;
  priceLKR: number | null;
  tagline: string;
  features: string[];
};

export const TIERS: Tier[] = [
  {
    key: "basic",
    name: "Basic",
    priceLKR: PLAN_PRICE_LKR,
    tagline: "Everything you need to take orders from your DMs.",
    features: [
      "Your mini storefront (Instagram + WhatsApp)",
      "Logo, accent colour & category navigation",
      "Unlimited products & orders",
      "Order, delivery & payment tracking",
      "Customer list & CSV exports",
    ],
  },
  {
    key: "studio",
    name: "Studio",
    priceLKR: null,
    tagline: "Make the storefront look unmistakably yours.",
    features: [
      "Everything in Basic",
      "Banner image + headline & tagline",
      "Curated fonts, background tones & a second colour",
      "Show / hide storefront sections",
      "Default product sort",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceLKR: null,
    tagline: "For shops heading toward a full website.",
    features: [
      "Everything in Studio",
      "Read API for your catalog & orders",
      "Remove the “powered by” line",
      "20% off when we build your full website",
    ],
  },
];
