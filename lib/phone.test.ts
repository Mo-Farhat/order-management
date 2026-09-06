import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/phone";

describe("normalizePhone (Sri Lanka)", () => {
  it("collapses the common formats of one number to a single value", () => {
    const canonical = "0771234567";
    for (const raw of [
      "0771234567",
      "077 123 4567",
      "077-123-4567",
      "+94771234567",
      "+94 77 123 4567",
      "94771234567",
      "771234567",
      "77 1234567",
    ]) {
      expect(normalizePhone(raw)).toBe(canonical);
    }
  });

  it("handles empty / nullish", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });

  it("keeps the last 10 digits for anything unrecognised", () => {
    expect(normalizePhone("001194771234567")).toBe("4771234567");
  });
});
