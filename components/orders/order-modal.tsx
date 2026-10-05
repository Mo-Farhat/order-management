"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Printer, X } from "lucide-react";
import { TERMINAL } from "@/lib/pipeline";
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

  // Re-fetch the panel now, but hold the list refresh until close: on a
  // filtered list ("Dispatched") the change would drop this order from the
  // rows and unmount the panel mid-task.
  const dirty = useRef(false);
  function refresh() {
    dirty.current = true;
    load();
  }
  const close = useCallback(() => {
    if (dirty.current) router.refresh();
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const iconBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50 sm:h-8 sm:px-3";

  // Phone: a full-screen panel (sticky header, sticky next-step bar from the
  // body). sm+: the centred dialog.
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain sm:flex sm:items-start sm:justify-center sm:p-8">
      <button aria-label="Close" onClick={close} className="fixed inset-0 hidden bg-black/40 sm:block" />
      <div className="relative z-10 flex min-h-full w-full flex-col bg-card sm:block sm:min-h-0 sm:max-w-4xl sm:rounded-xl sm:border sm:border-line sm:shadow-xl">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-card px-4 py-3 sm:static sm:rounded-t-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={close}
              aria-label="Close"
              className="-ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink sm:hidden"
            >
              <X size={20} />
            </button>
            <h2 className="truncate text-base font-semibold">
              Order <span className="font-mono">#{order?.orderNumber ?? "…"}</span>
            </h2>
            {order && <StatusPill status={order.status} />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {order && !TERMINAL.includes(order.status) && (
              <Link href={`/desk/orders/${orderId}/edit`} aria-label="Edit order" className={iconBtn}>
                <Pencil size={14} />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            )}
            {order && (
              <a
                href={`/invoice/${orderId}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Print invoice"
                className={iconBtn}
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Print invoice</span>
              </a>
            )}
            <button onClick={close} aria-label="Close" className="hidden text-muted hover:text-ink sm:block">
              ✕
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-4 pt-4 sm:block sm:p-5">
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
