import { describe, it, expect } from "vitest";
import {
  MAIN_NEXT,
  isLegalTransition,
  canAdvance,
  canCancel,
  canReturn,
  NEEDS_ACTION,
} from "@/lib/pipeline";
import type { OrderStatus } from "@/db/schema";

const ALL: OrderStatus[] = [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

describe("MAIN_NEXT", () => {
  it("is the fixed forward chain, ending at delivered", () => {
    expect(MAIN_NEXT).toEqual({
      draft: "confirmed",
      confirmed: "packed",
      packed: "shipped",
      shipped: "delivered",
    });
    expect(MAIN_NEXT.delivered).toBeUndefined();
  });
});

describe("isLegalTransition", () => {
  it("allows each forward step", () => {
    expect(isLegalTransition("draft", "confirmed")).toBe(true);
    expect(isLegalTransition("confirmed", "packed")).toBe(true);
    expect(isLegalTransition("packed", "shipped")).toBe(true);
    expect(isLegalTransition("shipped", "delivered")).toBe(true);
  });

  it("rejects skipping a step or moving backward", () => {
    expect(isLegalTransition("draft", "packed")).toBe(false);
    expect(isLegalTransition("draft", "delivered")).toBe(false);
    expect(isLegalTransition("packed", "confirmed")).toBe(false);
    expect(isLegalTransition("delivered", "shipped")).toBe(false);
  });

  it("allows cancel from any pre-delivery state, not after", () => {
    expect(isLegalTransition("draft", "cancelled")).toBe(true);
    expect(isLegalTransition("confirmed", "cancelled")).toBe(true);
    expect(isLegalTransition("shipped", "cancelled")).toBe(true);
    expect(isLegalTransition("delivered", "cancelled")).toBe(false);
  });

  it("allows return only from delivered", () => {
    expect(isLegalTransition("delivered", "returned")).toBe(true);
    expect(isLegalTransition("shipped", "returned")).toBe(false);
    expect(isLegalTransition("draft", "returned")).toBe(false);
  });

  it("locks terminal states", () => {
    for (const to of ALL) {
      if (to === "cancelled") continue;
      expect(isLegalTransition("cancelled", to)).toBe(false);
    }
    for (const to of ALL) {
      if (to === "returned") continue;
      expect(isLegalTransition("returned", to)).toBe(false);
    }
  });

  it("treats a no-op move as legal", () => {
    for (const s of ALL) expect(isLegalTransition(s, s)).toBe(true);
  });
});

describe("predicates", () => {
  it("canAdvance is true iff there is a next step", () => {
    expect(canAdvance("draft")).toBe(true);
    expect(canAdvance("shipped")).toBe(true);
    expect(canAdvance("delivered")).toBe(false);
    expect(canAdvance("cancelled")).toBe(false);
  });

  it("canCancel / canReturn", () => {
    expect(canCancel("packed")).toBe(true);
    expect(canCancel("delivered")).toBe(false);
    expect(canReturn("delivered")).toBe(true);
    expect(canReturn("shipped")).toBe(false);
  });

  it("NEEDS_ACTION is confirmed + packed", () => {
    expect([...NEEDS_ACTION].sort()).toEqual(["confirmed", "packed"]);
  });
});
