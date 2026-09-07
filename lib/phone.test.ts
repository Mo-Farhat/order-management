import { describe, it, expect } from "vitest";
import { normalizePhone, toWhatsAppNumber } from "@/lib/phone";

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

describe("toWhatsAppNumber (wa.me deep link form)", () => {
  it("produces the same international number regardless of input format", () => {
    for (const raw of ["0771234567", "077 123 4567", "+94 77 123 4567", "94771234567"]) {
      expect(toWhatsAppNumber(raw)).toBe("94771234567");
    }
  });

  it("handles empty / nullish", () => {
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
  });
});
