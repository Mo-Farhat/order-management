import type { OrderStatus, DeliveryStatus } from "@/db/schema";

/**
 * Order state — pure logic, no DB, no `server-only`. Both the order engine
 * (`lib/orders.ts`) and the test suite import from here.
 *
 * Three independent axes:
 *   - order status    — Confirmed / Completed / Cancelled / Returned (free choice)
 *   - delivery status — Pending → Dispatched → Delivered
 *   - payment status  — Unpaid / Partial / Paid (see lib/money + orders)
 */

export const ORDER_STATUSES: OrderStatus[] = ["confirmed", "completed", "cancelled", "returned"];
export const DELIVERY_STATUSES: DeliveryStatus[] = ["pending", "dispatched", "delivered"];

/** Terminal order states — stock is released and the order is closed. */
export const TERMINAL: OrderStatus[] = ["cancelled", "returned"];

/** Order status is a free choice among the active values (legacy values rejected). */
export function isValidOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(s);
}

export function isValidDeliveryStatus(s: string): s is DeliveryStatus {
  return (DELIVERY_STATUSES as string[]).includes(s);
}

/**
 * Whether an order in `status` should be holding committed stock.
 * Confirmed / Completed hold stock; Cancelled / Returned release it.
 */
export function shouldHoldStock(status: OrderStatus): boolean {
  return status === "confirmed" || status === "completed";
}

/** Labels for UI. Legacy statuses map to their closest current label. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  packed: "Confirmed",
  shipped: "Confirmed",
  delivered: "Completed",
  completed: "Completed",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: "Pending",
  dispatched: "Dispatched",
  delivered: "Delivered",
};
