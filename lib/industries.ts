/**
 * What a shop sells. Asked at signup, changeable any time in Settings. It only
 * sets *defaults* — option presets on new products, placeholders — never the
 * data model, so switching later is harmless and mixed shops just work.
 *
 * No runtime deps: client components import this directly. Keep the values in
 * sync with the `industry` Postgres enum (`db/schema.ts`).
 */
export const INDUSTRIES = [
  "general",
  "clothing",
  "food",
  "beauty",
  "jewellery",
  "home",
  "other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABEL: Record<Industry, string> = {
  general: "A bit of everything",
  clothing: "Clothing & shoes",
  food: "Food, cakes & bakes",
  beauty: "Beauty & cosmetics",
  jewellery: "Jewellery & accessories",
  home: "Home, candles & gifts",
  other: "Something else",
};

/** Short label for dense places (admin table, badges). */
export const INDUSTRY_SHORT: Record<Industry, string> = {
  general: "General",
  clothing: "Clothing",
  food: "Food",
  beauty: "Beauty",
  jewellery: "Jewellery",
  home: "Home & gifts",
  other: "Other",
};

export function isIndustry(v: unknown): v is Industry {
  return typeof v === "string" && (INDUSTRIES as readonly string[]).includes(v);
}

type OptionPreset = { name: string; values: string[] };

/**
 * Pre-filled when a seller taps "Add options" on a new product. Option 1 is
 * filled in with values; option 2 is only a suggested name.
 */
export const INDUSTRY_PRESETS: Record<
  Industry,
  { option1: OptionPreset; option2Name: string; productPlaceholder: string }
> = {
  general: { option1: { name: "Size", values: [] }, option2Name: "Colour", productPlaceholder: "e.g. Tote bag" },
  clothing: {
    option1: { name: "Size", values: ["S", "M", "L", "XL"] },
    option2Name: "Colour",
    productPlaceholder: "e.g. Linen midi dress",
  },
  food: {
    option1: { name: "Size", values: ["500g", "1kg", "2kg"] },
    option2Name: "Flavour",
    productPlaceholder: "e.g. Chocolate fudge cake",
  },
  beauty: {
    option1: { name: "Size", values: ["30ml", "50ml", "100ml"] },
    option2Name: "Shade",
    productPlaceholder: "e.g. Rose face serum",
  },
  jewellery: {
    option1: { name: "Colour", values: ["Gold", "Silver"] },
    option2Name: "Size",
    productPlaceholder: "e.g. Pearl drop earrings",
  },
  home: {
    option1: { name: "Size", values: ["Small", "Medium", "Large"] },
    option2Name: "Scent",
    productPlaceholder: "e.g. Soy wax candle",
  },
  other: { option1: { name: "Option", values: [] }, option2Name: "", productPlaceholder: "e.g. Product name" },
};

/** "M" or "M / Red" — the one way a variant is named everywhere. */
export function variantLabel(option1: string, option2?: string | null): string {
  return option2 ? `${option1} / ${option2}` : option1;
}
