"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const ORDER_OPTS = [
  ["", "Any order status"],
  ["pending", "Pending review"],
  ["confirmed", "Confirmed"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["returned", "Returned"],
];
const DELIVERY_OPTS = [
  ["", "Any delivery"],
  ["pending", "Pending"],
  ["dispatched", "Dispatched"],
  ["delivered", "Delivered"],
];
const PAYMENT_OPTS = [
  ["", "Any payment"],
  ["unpaid", "Unpaid"],
  ["partial", "Partial"],
  ["paid", "Paid"],
];

/** One-tap views for the questions sellers actually ask. */
const QUICK: { label: string; params: Record<string, string> }[] = [
  { label: "All", params: {} },
  { label: "Needs review", params: { status: "pending" } },
  { label: "To dispatch", params: { status: "confirmed", delivery: "pending" } },
  { label: "Dispatched", params: { delivery: "dispatched" } },
  { label: "Unpaid", params: { payment: "unpaid" } },
];
const AXES = ["status", "delivery", "payment"] as const;

export function OrderFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [sheet, setSheet] = useState(false);

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any filter change resets to the first page
    router.push(`/desk/orders?${next.toString()}`);
  }

  function applyQuick(params: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    for (const k of AXES) next.delete(k);
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    next.delete("page");
    router.push(`/desk/orders?${next.toString()}`);
  }
  const quickActive = (params: Record<string, string>) =>
    AXES.every((k) => (sp.get(k) ?? "") === (params[k] ?? ""));

  const selCls =
    "h-11 w-full rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent md:h-9 md:w-auto";
  const active = ["status", "delivery", "payment", "from", "to", "q"].some((k) => sp.get(k));
  const sheetCount = ["status", "delivery", "payment", "from", "to"].filter((k) => sp.get(k)).length;

  const controls = (
    <>
      <select value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)} className={selCls}>
        {ORDER_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("delivery") ?? ""} onChange={(e) => set("delivery", e.target.value)} className={selCls}>
        {DELIVERY_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("payment") ?? ""} onChange={(e) => set("payment", e.target.value)} className={selCls}>
        {PAYMENT_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
        <label className="flex flex-col gap-1 text-xs text-muted md:flex-row md:items-center">
          from
          <input
            type="date"
            value={sp.get("from") ?? ""}
            onChange={(e) => set("from", e.target.value)}
            className={selCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted md:flex-row md:items-center">
          to
          <input
            type="date"
            value={sp.get("to") ?? ""}
            onChange={(e) => set("to", e.target.value)}
            className={selCls}
          />
        </label>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set("q", q.trim());
          }}
          className="min-w-0 flex-1"
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, customer, phone…"
            className="h-11 w-full min-w-40 rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-accent md:h-9"
          />
        </form>

        {/* phone: everything else lives in a sheet */}
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm md:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters
          {sheetCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-fg">
              {sheetCount}
            </span>
          )}
        </button>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          {controls}
          {active && (
            <button
              type="button"
              onClick={() => router.push("/desk/orders")}
              className="rounded-lg border border-line px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {QUICK.map((c) => {
          const on = quickActive(c.params);
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => applyQuick(c.params)}
              aria-pressed={on}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors ${
                on ? "border-accent bg-accent text-accent-fg" : "border-line bg-card text-muted hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close filters" onClick={() => setSheet(false)} className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col gap-3 overflow-y-auto rounded-t-xl bg-card px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              {active && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    router.push("/desk/orders");
                  }}
                  className="text-xs text-muted underline"
                >
                  Clear all
                </button>
              )}
            </div>
            {controls}
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="mt-1 h-11 rounded-md bg-accent font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
