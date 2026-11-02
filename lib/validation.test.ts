import { describe, expect, it } from "vitest";
import { onAccentFor, productOptionsSchema, storefrontConfigSchema } from "@/lib/validation";

describe("onAccentFor", () => {
  it("returns a manual hex when given a valid one", () => {
    expect(onAccentFor("#1e40af", "#ff0000")).toBe("#ff0000");
  });
  it("picks white on a dark accent, dark on a light accent", () => {
    expect(onAccentFor("#1e40af")).toBe("#ffffff");
    expect(onAccentFor("#fde047")).toBe("#0f172a");
  });
  it("falls back safely on junk input", () => {
    expect(onAccentFor("not-a-colour")).toBe("#ffffff");
    expect(onAccentFor(null)).toBe("#ffffff");
  });
});

describe("storefrontConfigSchema", () => {
  it("accepts a partial config and rejects a bad enum", () => {
    expect(storefrontConfigSchema.safeParse({ font: "serif", tagline: "hi" }).success).toBe(true);
    expect(storefrontConfigSchema.safeParse({ font: "comic-sans" }).success).toBe(false);
  });
  it("rejects a non-hex colour", () => {
    expect(storefrontConfigSchema.safeParse({ secondaryColor: "blue" }).success).toBe(false);
    expect(storefrontConfigSchema.safeParse({ secondaryColor: "#334155" }).success).toBe(true);
  });
});

describe("productOptionsSchema", () => {
  const v = (option1: string, option2 = "", stockQty = 1, price = "") => ({ option1, option2, stockQty, price });

  it("treats no variants as a simple product", () => {
    const r = productOptionsSchema.safeParse({});
    expect(r.success && r.data.variants).toEqual([]);
  });

  it("accepts one option with per-variant price and stock", () => {
    const r = productOptionsSchema.safeParse({
      option1Name: "Size",
      variants: [v("S"), v("M", "", 3, "1500")],
    });
    expect(r.success).toBe(true);
  });

  it("requires a name for the option", () => {
    const r = productOptionsSchema.safeParse({ option1Name: "", variants: [v("S")] });
    expect(r.success).toBe(false);
  });

  it("rejects duplicate combinations, case-insensitively", () => {
    const r = productOptionsSchema.safeParse({
      option1Name: "Size",
      option2Name: "Colour",
      variants: [v("M", "Red"), v("m", "red")],
    });
    expect(r.success).toBe(false);
  });

  it("needs a second value on every combination when there are two options", () => {
    const r = productOptionsSchema.safeParse({
      option1Name: "Size",
      option2Name: "Colour",
      variants: [v("M", "Red"), v("L")],
    });
    expect(r.success).toBe(false);
  });
});
