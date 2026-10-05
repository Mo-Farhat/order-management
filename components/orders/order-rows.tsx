"use client";

import Link from "next/link";
import type { OrderListRow } from "@/lib/orders";
import { toCents, fromCents } from "@/lib/money";
import { DeliveryPill, PaymentPill, relativeTime } from "@/components/orders/status-pill";

/**
 * Phone layout for an order list — two-line "inbox" rows instead of the
 * 11-column desk table. Line one: number, customer, total. Line two: what
 * they bought, payment + delivery state, age. Tapping opens the order
 * (`onOpen` → the full-screen order panel; without it, a link to the order page).
 */
export function OrderRows({
  rows,
  currency,
  onOpen,
}: {
  rows: OrderListRow[];
  currency: string;
  onOpen?: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {rows.map((o) => {
        const balanceCents = toCents(o.total) - toCents(o.amountPaid);
        const pending = o.status === "pending";
        const closed = o.status === "cancelled" || o.status === "returned";
        const items =
          o.itemCount > 1
            ? `${o.firstItemName ?? "Item"} +${o.itemCount - 1}`
            : (o.firstItemName ?? "—");

        const inner = (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-accent">#{o.orderNumber}</span>
              <span className={`min-w-0 flex-1 truncate font-medium ${closed ? "text-muted line-through" : ""}`}>
                {o.customerName}
              </span>
              <span className="shrink-0 tabular-nums font-medium">
                {currency} {o.total}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{items}</span>
              {pending ? (
                <span className="rounded-md border border-warn/50 bg-warn/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-warn">
                  Review
                </span>
              ) : closed ? (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-danger">
                  {o.status}
                </span>
              ) : (
                <>
                  <PaymentPill status={o.paymentStatus} />
                  <DeliveryPill status={o.deliveryStatus} />
                </>
              )}
              <span className="w-12 shrink-0 text-right text-[11px] text-muted">
                {relativeTime(o.createdAt).replace(" ago", "")}
              </span>
            </div>
            {!pending && !closed && balanceCents > 0 && o.paymentStatus === "partial" && (
              <p className="mt-1 text-[11px] text-danger">
                {currency} {fromCents(balanceCents)} due
              </p>
            )}
          </>
        );

        const cls = `block w-full px-4 py-3 text-left text-sm active:bg-surface ${
          pending ? "border-l-2 border-l-warn bg-warn/5" : ""
        }`;
        return (
          <li key={o.id}>
            {onOpen ? (
              <button type="button" onClick={() => onOpen(o.id)} className={cls}>
                {inner}
              </button>
            ) : (
              <Link href={`/desk/orders/${o.id}`} className={cls}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
