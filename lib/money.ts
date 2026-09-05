/**
 * All order math is done in integer cents to avoid floating-point drift, then
 * formatted back to a 2-decimal string for the `numeric` columns.
 */

export function toCents(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export type DiscountType = "none" | "flat" | "percent";

export function computeTotals(input: {
  items: { priceCents: number; quantity: number }[];
  deliveryFeeCents: number;
  discountType: DiscountType;
  discountValue: number; // cents for "flat", whole percent for "percent"
}): {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  lineTotalsCents: number[];
} {
  const lineTotalsCents = input.items.map((i) => i.priceCents * i.quantity);
  const subtotalCents = lineTotalsCents.reduce((a, b) => a + b, 0);

  let discountCents = 0;
  if (input.discountType === "flat") {
    discountCents = Math.min(input.discountValue, subtotalCents);
  } else if (input.discountType === "percent") {
    const pct = Math.max(0, Math.min(100, input.discountValue));
    discountCents = Math.round((subtotalCents * pct) / 100);
  }

  const totalCents = Math.max(0, subtotalCents - discountCents) + input.deliveryFeeCents;
  return { subtotalCents, discountCents, totalCents, lineTotalsCents };
}
