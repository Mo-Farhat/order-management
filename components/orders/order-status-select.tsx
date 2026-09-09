"use client";

import { useState, useTransition } from "react";
import {
  ORDER_STATUSES,
  DELIVERY_STATUSES,
  ORDER_STATUS_LABEL,
  DELIVERY_STATUS_LABEL,
} from "@/lib/pipeline";
import { setOrderStatusAction, setDeliveryStatusAction } from "@/app/actions/orders";
import { Spinner } from "@/components/desk/ui";
import type { OrderStatus, DeliveryStatus } from "@/db/schema";

type Kind = "order" | "delivery";

const TONE: Record<string, string> = {
  confirmed: "border-accent/40 text-ink",
  completed: "border-ok/40 bg-ok/10 text-ok",
  cancelled: "border-danger/40 text-danger",
  returned: "border-danger/40 text-danger",
  pending: "border-line text-muted",
  dispatched: "border-warn/50 text-warn",
  delivered: "border-ok/40 bg-ok/10 text-ok",
};

export function StatusSelect({
  orderId,
  kind,
  value,
  onDone,
}: {
  orderId: string;
  kind: Kind;
  value: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const options =
    kind === "order"
      ? ORDER_STATUSES.map((s) => [s, ORDER_STATUS_LABEL[s as OrderStatus]] as const)
      : DELIVERY_STATUSES.map((s) => [s, DELIVERY_STATUS_LABEL[s as DeliveryStatus]] as const);

  // legacy order statuses (packed/shipped/…) still show — normalise to Confirmed
  const current = kind === "order" && !ORDER_STATUSES.includes(value as OrderStatus)
    ? "confirmed"
    : value;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="relative flex items-center">
      <select
        value={current}
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const to = e.target.value;
          if (to === current) return;
          start(async () => {
            const res =
              kind === "order"
                ? await setOrderStatusAction(orderId, to)
                : await setDeliveryStatusAction(orderId, to);
            setErr(res?.error ?? null);
            if (!res?.error) onDone?.();
          });
        }}
        className={`rounded-md border bg-card px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide outline-none focus:border-accent disabled:opacity-50 ${
          TONE[current] ?? "border-line"
        }`}
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      {pending && (
        <Spinner className="pointer-events-none absolute right-5 text-muted" />
      )}
      </div>
      {err && <span className="text-[10px] text-danger">{err}</span>}
    </div>
  );
}
