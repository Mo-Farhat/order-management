import type { OrderStatus } from "@/db/schema";

/**
 * Order pipeline (FR-9) — pure logic, no DB, no `server-only`. Both the order
 * engine (`lib/orders.ts`) and the test suite import from here.
 *
 * Fixed pipeline: Draft → Confirmed → Packed → Shipped → Delivered, with
 * Cancelled and Returned as branches. Not configurable, by design.
 */

export const MAIN_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  draft: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "delivered",
};

export const CANCELLABLE: OrderStatus[] = ["draft", "confirmed", "packed", "shipped"];
export const TERMINAL: OrderStatus[] = ["cancelled", "returned"];
export const NEEDS_ACTION: OrderStatus[] = ["confirmed", "packed"];

export function canAdvance(status: OrderStatus): boolean {
  return status in MAIN_NEXT;
}
export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE.includes(status);
}
export function canReturn(status: OrderStatus): boolean {
  return status === "delivered";
}

/** The single source of truth for whether a status move is allowed. */
export function isLegalTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return (
    MAIN_NEXT[from] === to ||
    (to === "cancelled" && canCancel(from)) ||
    (to === "returned" && canReturn(from))
  );
}
