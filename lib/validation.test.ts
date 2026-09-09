import { describe, expect, it } from "vitest";
import { onAccentFor, storefrontConfigSchema } from "@/lib/validation";

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
