"use client";

import { useState, useTransition } from "react";
import { legalMoves } from "@/lib/pipeline";
import { setOrderStatusAction } from "@/app/actions/orders";
import type { OrderStatus } from "@/db/schema";

const LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const TONE: Record<OrderStatus, string> = {
  draft: "text-muted border-line",
  confirmed: "text-ink border-accent/50",
  packed: "text-ink border-accent/50",
  shipped: "text-ink border-accent/50",
  delivered: "text-accent border-accent/50 bg-accent-weak",
  cancelled: "text-danger border-danger/40",
  returned: "text-danger border-danger/40",
};

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const moves = legalMoves(status);

  if (moves.length === 0) {
    return (
      <span
        className={`inline-flex rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${TONE[status]}`}
      >
        {LABEL[status]}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <select
        value={status}
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const to = e.target.value as OrderStatus;
          if (to === status) return;
          start(async () => {
            const res = await setOrderStatusAction(orderId, to);
            setErr(res?.error ?? null);
          });
        }}
        className={`rounded-md border bg-card px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide outline-none focus:border-accent disabled:opacity-50 ${TONE[status]}`}
      >
        <option value={status}>{LABEL[status]}</option>
        {moves.map((m) => (
          <option key={m} value={m}>
            → {LABEL[m]}
          </option>
        ))}
      </select>
      {err && <span className="text-[10px] text-danger">{err}</span>}
    </div>
  );
}
