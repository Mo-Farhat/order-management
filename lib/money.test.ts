import { describe, it, expect } from "vitest";
import { toCents, fromCents, computeTotals } from "@/lib/money";

describe("toCents / fromCents", () => {
  it("parses decimal strings without float drift", () => {
    expect(toCents("12.50")).toBe(1250);
    expect(toCents("0.1")).toBe(10);
    expect(toCents("1200")).toBe(120000);
    expect(toCents(12.5)).toBe(1250);
  });

  it("treats blank / nullish as zero", () => {
    expect(toCents("")).toBe(0);
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents("not a number")).toBe(0);
  });

  it("round-trips to a 2-decimal string", () => {
    expect(fromCents(1250)).toBe("12.50");
    expect(fromCents(1)).toBe("0.01");
    expect(fromCents(0)).toBe("0.00");
  });
});

describe("computeTotals", () => {
  const items = [
    { priceCents: 65000, quantity: 2 }, // 1300.00
    { priceCents: 45000, quantity: 1 }, // 450.00
  ];

  it("sums line totals and adds the delivery fee", () => {
    const t = computeTotals({ items, deliveryFeeCents: 10000, discountType: "none", discountValue: 0 });
    expect(t.lineTotalsCents).toEqual([130000, 45000]);
    expect(t.subtotalCents).toBe(175000);
    expect(t.discountCents).toBe(0);
    expect(t.totalCents).toBe(185000);
  });

  it("applies a flat discount, clamped to the subtotal", () => {
    const t = computeTotals({ items, deliveryFeeCents: 0, discountType: "flat", discountValue: 20000 });
    expect(t.discountCents).toBe(20000);
    expect(t.totalCents).toBe(155000);

    const over = computeTotals({ items, deliveryFeeCents: 0, discountType: "flat", discountValue: 999999 });
    expect(over.discountCents).toBe(175000);
    expect(over.totalCents).toBe(0);
  });

  it("applies a percent discount, clamped to 0–100", () => {
    const t = computeTotals({ items, deliveryFeeCents: 0, discountType: "percent", discountValue: 10 });
    expect(t.discountCents).toBe(17500);
    expect(t.totalCents).toBe(157500);

    const huge = computeTotals({ items, deliveryFeeCents: 0, discountType: "percent", discountValue: 250 });
    expect(huge.discountCents).toBe(175000);
  });

  it("never returns a negative total; delivery fee is added after the discount", () => {
    const t = computeTotals({
      items: [{ priceCents: 1000, quantity: 1 }],
      deliveryFeeCents: 500,
      discountType: "flat",
      discountValue: 5000,
    });
    expect(t.totalCents).toBe(500); // 0 goods + 500 delivery
  });
});
