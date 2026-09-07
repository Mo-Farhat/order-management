import { describe, it, expect } from "vitest";
import { normalizePhone, toWhatsAppNumber } from "@/lib/phone";

describe("normalizePhone (customer dedupe key)", () => {
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

  it("dedupes an international number consistently", () => {
    expect(normalizePhone("+1 415 555 1234")).toBe(normalizePhone("+1 (415) 555-1234"));
  });
});

describe("toWhatsAppNumber (wa.me deep link form)", () => {
  it("preserves an explicitly entered country code", () => {
    expect(toWhatsAppNumber("+1 415 555 1234")).toBe("14155551234");
    expect(toWhatsAppNumber("+44 7700 900123")).toBe("447700900123");
    expect(toWhatsAppNumber("+971 50 123 4567")).toBe("971501234567");
  });

  it("strips a 00 international access prefix", () => {
    expect(toWhatsAppNumber("0044 7700 900123")).toBe("447700900123");
  });

  it("expands a bare local number using the default country code", () => {
    for (const raw of ["0771234567", "077 123 4567", "+94 77 123 4567", "94771234567"]) {
      expect(toWhatsAppNumber(raw)).toBe("94771234567");
    }
  });

  it("handles empty / nullish", () => {
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
    expect(toWhatsAppNumber("abc")).toBeNull();
  });
});
