"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderDetail } from "@/lib/orders";
import { getOrderDetailAction } from "@/app/actions/orders";
import { OrderDetailBody } from "@/components/orders/order-detail-body";
import { StatusPill } from "@/components/orders/status-pill";

export function OrderModal({
  orderId,
  currency,
  onClose,
}: {
  orderId: string;
  currency: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getOrderDetailAction(orderId);
    setOrder(data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    load();
  }, [load]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function refresh() {
    load();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-4xl rounded-xl border border-line bg-card shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">
              Order <span className="font-mono">#{order?.orderNumber ?? "…"}</span>
            </h2>
            {order && <StatusPill status={order.status} />}
          </div>
          <div className="flex items-center gap-3">
            {order && (
              <a
                href={`/invoice/${orderId}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50"
              >
                Print invoice
              </a>
            )}
            <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
        </header>

        <div className="p-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : !order ? (
            <p className="py-10 text-center text-sm text-muted">Order not found.</p>
          ) : (
            <OrderDetailBody order={order} currency={currency} onChange={refresh} />
          )}
        </div>
      </div>
    </div>
  );
}
