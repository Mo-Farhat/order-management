import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  DELIVERY_STATUSES,
  TERMINAL,
  isValidOrderStatus,
  isValidDeliveryStatus,
  shouldHoldStock,
  ORDER_STATUS_LABEL,
} from "@/lib/pipeline";

describe("order status model", () => {
  it("active order statuses", () => {
    expect(ORDER_STATUSES).toEqual(["confirmed", "completed", "cancelled", "returned"]);
    expect(DELIVERY_STATUSES).toEqual(["pending", "dispatched", "delivered"]);
  });

  it("validators reject legacy / unknown values", () => {
    expect(isValidOrderStatus("confirmed")).toBe(true);
    expect(isValidOrderStatus("completed")).toBe(true);
    expect(isValidOrderStatus("draft")).toBe(false);
    expect(isValidOrderStatus("packed")).toBe(false);
    expect(isValidOrderStatus("nonsense")).toBe(false);

    expect(isValidDeliveryStatus("dispatched")).toBe(true);
    expect(isValidDeliveryStatus("shipped")).toBe(false);
  });

  it("stock is held while confirmed/completed, released when cancelled/returned", () => {
    expect(shouldHoldStock("confirmed")).toBe(true);
    expect(shouldHoldStock("completed")).toBe(true);
    expect(shouldHoldStock("cancelled")).toBe(false);
    expect(shouldHoldStock("returned")).toBe(false);
  });

  it("TERMINAL is cancelled + returned", () => {
    expect([...TERMINAL].sort()).toEqual(["cancelled", "returned"]);
  });

  it("legacy statuses map to a current label", () => {
    expect(ORDER_STATUS_LABEL.draft).toBe("Draft");
    expect(ORDER_STATUS_LABEL.packed).toBe("Confirmed");
    expect(ORDER_STATUS_LABEL.delivered).toBe("Completed");
  });
});
