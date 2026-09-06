"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const ORDER_OPTS = [
  ["", "Any order status"],
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

export function OrderFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/desk/orders?${next.toString()}`);
  }

  const selCls =
    "h-9 rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent";
  const active = ["status", "delivery", "payment", "from", "to", "q"].some((k) => sp.get(k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          set("q", q.trim());
        }}
        className="flex-1"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order #, customer, phone…"
          className="h-9 w-full min-w-40 rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-accent"
        />
      </form>

      <select value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)} className={selCls}>
        {ORDER_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("delivery") ?? ""} onChange={(e) => set("delivery", e.target.value)} className={selCls}>
        {DELIVERY_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={sp.get("payment") ?? ""} onChange={(e) => set("payment", e.target.value)} className={selCls}>
        {PAYMENT_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      <label className="flex items-center gap-1 text-xs text-muted">
        from
        <input
          type="date"
          value={sp.get("from") ?? ""}
          onChange={(e) => set("from", e.target.value)}
          className={selCls}
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-muted">
        to
        <input
          type="date"
          value={sp.get("to") ?? ""}
          onChange={(e) => set("to", e.target.value)}
          className={selCls}
        />
      </label>

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
  );
}
