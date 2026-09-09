import type { PlanTier } from "@/db/schema";
import type { StorefrontConfig } from "@/lib/validation";
import { STOREFRONT_DEFAULTS } from "@/lib/validation";

/**
 * Feature tiers for the storefront. `plan_tier` on `tenants` is set manually by
 * a platform operator (`app/actions/admin.ts`) until billing is wired.
 *
 * Type-only import of `PlanTier` (like `lib/plans.ts`) so this module stays
 * client-importable — `share-settings-form.tsx` uses `tierAllows` to lock
 * fields, and the marketing pricing page reads the feature lists.
 */
export const TIER_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "studio", label: "Studio" },
  { value: "pro", label: "Pro" },
];
export const TIER_VALUES = TIER_OPTIONS.map((t) => t.value) as [PlanTier, ...PlanTier[]];

export const STOREFRONT_FEATURES = [
  // Basic
  "logoUpload",
  "accentColor",
  "onAccentColor",
  "categoryOrder",
  "policyNote",
  "pauseToggle",
  "contactLinks",
  // Studio
  "bannerImage",
  "tagline",
  "heroCopy",
  "fontChoice",
  "secondaryColor",
  "bgTone",
  "sectionToggles",
  "defaultSort",
  // Pro
  "readApi",
  "websiteUpsellDiscount",
  "removePoweredBy",
] as const;
export type StorefrontFeature = (typeof STOREFRONT_FEATURES)[number];

const BASIC: StorefrontFeature[] = [
  "logoUpload",
  "accentColor",
  "onAccentColor",
  "categoryOrder",
  "policyNote",
  "pauseToggle",
  "contactLinks",
];
const STUDIO: StorefrontFeature[] = [
  ...BASIC,
  "bannerImage",
  "tagline",
  "heroCopy",
  "fontChoice",
  "secondaryColor",
  "bgTone",
  "sectionToggles",
  "defaultSort",
];
const PRO: StorefrontFeature[] = [
  ...STUDIO,
  "readApi",
  "websiteUpsellDiscount",
  "removePoweredBy",
];

export const FEATURES_BY_TIER: Record<PlanTier, ReadonlySet<StorefrontFeature>> = {
  basic: new Set(BASIC),
  studio: new Set(STUDIO),
  pro: new Set(PRO),
};

export function tierAllows(tier: PlanTier | null | undefined, feature: StorefrontFeature): boolean {
  return FEATURES_BY_TIER[tier ?? "basic"]?.has(feature) ?? false;
}

export function tierRank(tier: PlanTier): number {
  return TIER_VALUES.indexOf(tier);
}

/** The lowest tier that unlocks a feature — for "✦ Studio" / "✦ Pro" labels. */
export function tierFor(feature: StorefrontFeature): PlanTier {
  for (const t of TIER_VALUES) if (FEATURES_BY_TIER[t].has(feature)) return t;
  return "pro";
}

/**
 * Maps a `StorefrontConfig` field to the feature that gates it. Used to drop
 * locked fields on save and to hide them at render.
 */
const CONFIG_FEATURE: Record<keyof StorefrontConfig, StorefrontFeature> = {
  tagline: "tagline",
  heroTitle: "heroCopy",
  heroSubtitle: "heroCopy",
  onAccentColor: "onAccentColor",
  secondaryColor: "secondaryColor",
  bgTone: "bgTone",
  font: "fontChoice",
  defaultSort: "defaultSort",
  sections: "sectionToggles",
};

/**
 * Strip config keys the tier doesn't allow (used before persisting). Keeps
 * unknown keys out too.
 */
export function pickAllowedConfig(raw: StorefrontConfig, tier: PlanTier): StorefrontConfig {
  const out: StorefrontConfig = {};
  for (const key of Object.keys(CONFIG_FEATURE) as (keyof StorefrontConfig)[]) {
    if (raw[key] === undefined) continue;
    if (tierAllows(tier, CONFIG_FEATURE[key])) {
      // @ts-expect-error — key-indexed assignment across a heterogeneous type
      out[key] = raw[key];
    }
  }
  return out;
}

/**
 * What the storefront actually renders: tier-allowed config keys only, with the
 * always-present defaults merged in. A downgraded shop keeps its stored values
 * in the row but they stop appearing here.
 */
export type HonoredConfig = StorefrontConfig &
  typeof STOREFRONT_DEFAULTS & {
    sections: {
      banner: boolean;
      policyNote: boolean;
      categoryNav: boolean;
      poweredBy: boolean;
    };
  };

export function honoredConfig(
  tier: PlanTier | null | undefined,
  raw: StorefrontConfig | null | undefined,
): HonoredConfig {
  const t = tier ?? "basic";
  const allowed = pickAllowedConfig(raw ?? {}, t);
  const s = allowed.sections ?? {};
  return {
    ...STOREFRONT_DEFAULTS,
    ...allowed,
    // sections default to "on" for anything the tier can toggle
    sections: {
      banner: s.banner ?? true,
      policyNote: s.policyNote ?? true,
      categoryNav: s.categoryNav ?? true,
      poweredBy: s.poweredBy ?? true,
    },
  };
}

/** Whether the "powered by" line may be hidden — Pro + explicitly toggled off. */
export function showsPoweredBy(
  tier: PlanTier | null | undefined,
  config: StorefrontConfig | null | undefined,
): boolean {
  if (!tierAllows(tier, "removePoweredBy")) return true;
  return config?.sections?.poweredBy !== false;
}
