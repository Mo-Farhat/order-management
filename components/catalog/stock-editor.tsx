"use client";

import { useRef, useState, useTransition } from "react";
import { quickSetStockAction } from "@/app/actions/catalog";

/**
 * Catalog S4 — quick stock editor. +/- steppers and direct entry, saves on blur
 * (and shortly after the last keystroke). No explicit save button.
 */
export function StockEditor({
  productId,
  stockQty,
}: {
  productId: string;
  stockQty: number;
}) {
  const [value, setValue] = useState(String(stockQty));
  const [saved, setSaved] = useState<number>(stockQty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when the server value changes (after a revalidation elsewhere).
  const [prevQty, setPrevQty] = useState(stockQty);
  if (stockQty !== prevQty) {
    setPrevQty(stockQty);
    setValue(String(stockQty));
    setSaved(stockQty);
  }

  function commit(next: number) {
    if (next === saved) return;
    startTransition(async () => {
      const res = await quickSetStockAction(productId, next);
      if (res.ok) {
        setSaved(res.stockQty);
        setValue(String(res.stockQty));
        setError(null);
      } else {
        setError(res.error);
        setValue(String(saved));
      }
    });
  }

  function scheduleCommit(raw: string) {
    setValue(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const n = Number(raw);
      if (Number.isInteger(n) && n >= 0) commit(n);
    }, 700);
  }

  function step(by: number) {
    if (timer.current) clearTimeout(timer.current);
    const n = Math.max(0, (Number(value) || 0) + by);
    setValue(String(n));
    commit(n);
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Decrease stock"
          className="flex size-7 items-center justify-center rounded-md border border-line text-sm"
        >
          −
        </button>
        <input
          value={value}
          inputMode="numeric"
          onChange={(e) => scheduleCommit(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={() => {
            const n = Number(value);
            if (Number.isInteger(n) && n >= 0) commit(n);
            else setValue(String(saved));
          }}
          aria-label="Stock quantity"
          className="h-7 w-12 rounded-md border border-line bg-paper text-center text-sm outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Increase stock"
          className="flex size-7 items-center justify-center rounded-md border border-line text-sm"
        >
          +
        </button>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-wide text-muted">
        {error ? <span className="text-danger">{error}</span> : pending ? "saving…" : "in stock"}
      </span>
    </div>
  );
}
