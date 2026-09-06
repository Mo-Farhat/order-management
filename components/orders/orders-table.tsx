"use client";

import { useState } from "react";
import type { OrderListRow } from "@/lib/orders";
import { toCents, fromCents } from "@/lib/money";
import { StatusSelect } from "@/components/orders/order-status-select";
import { PaymentPill } from "@/components/orders/status-pill";
import { OrderModal } from "@/components/orders/order-modal";

export function OrdersTable({
  rows,
  currency,
}: {
  rows: OrderListRow[];
  currency: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line bg-surface">
            <tr>
              {["Order", "Customer", "Product", "Sale date", "Dispatched", "Total", "Paid", "Balance", "Payment", "Delivery", "Order"].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-muted"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => {
              const balanceCents = toCents(o.total) - toCents(o.amountPaid);
              return (
                <tr
                  key={o.id}
                  onClick={() => setOpenId(o.id)}
                  className="cursor-pointer hover:bg-surface/60"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-accent">#{o.orderNumber}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{o.customerName}</span>
                    {o.customerPhone && (
                      <span className="block text-xs text-muted">{o.customerPhone}</span>
                    )}
                  </td>
                  <td className="max-w-48 px-3 py-2.5">
                    <span className="block truncate">{o.firstItemName ?? "—"}</span>
                    {o.itemCount > 1 && (
                      <span className="text-xs text-muted">+{o.itemCount - 1} more</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                    {o.dispatchedAt ? new Date(o.dispatchedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{currency} {o.total}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{currency} {o.amountPaid}</td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums ${balanceCents > 0 ? "text-danger" : "text-muted"}`}
                  >
                    {currency} {fromCents(Math.max(0, balanceCents))}
                  </td>
                  <td className="px-3 py-2.5">
                    <PaymentPill status={o.paymentStatus} />
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect orderId={o.id} kind="delivery" value={o.deliveryStatus} />
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect orderId={o.id} kind="order" value={o.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openId && (
        <OrderModal orderId={openId} currency={currency} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
