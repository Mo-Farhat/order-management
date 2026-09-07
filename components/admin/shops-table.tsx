"use client";

import { useMemo, useState } from "react";
import type { ShopRow } from "@/lib/admin";
import { PlanCell } from "@/components/admin/plan-cell";

type SortKey = "name" | "createdAt" | "orders" | "gmv" | "lastOrderAt" | "customers";

function nfmt(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : n.toFixed(0);
}
function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString() : "—";
}
function relative(s: string | null) {
  if (!s) return "never";
  const days = Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ShopsTable({ rows }: { rows: ShopRow[] }) {
  const [sort, setSort] = useState<SortKey>("gmv");
  const [dir, setDir] = useState<1 | -1>(-1);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sort) {
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "createdAt":
        case "lastOrderAt":
          av = a[sort] ? new Date(a[sort]!).getTime() : 0;
          bv = b[sort] ? new Date(b[sort]!).getTime() : 0;
          break;
        default:
          av = a[sort];
          bv = b[sort];
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return copy;
  }, [rows, sort, dir]);

  function header(key: SortKey, label: string, align: "left" | "right" = "left") {
    const active = sort === key;
    return (
      <th
        onClick={() => {
          if (active) setDir((d) => (d === 1 ? -1 : 1));
          else {
            setSort(key);
            setDir(key === "name" ? 1 : -1);
          }
        }}
        className={`cursor-pointer whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted select-none ${
          align === "right" ? "text-right" : "text-left"
        } ${active ? "text-ink" : ""}`}
      >
        {label} {active ? (dir === 1 ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-b border-line bg-surface">
          <tr>
            {header("name", "Shop")}
            <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">Plan</th>
            {header("createdAt", "Joined", "right")}
            {header("orders", "Orders", "right")}
            {header("gmv", "GMV", "right")}
            {header("customers", "Customers", "right")}
            {header("lastOrderAt", "Last order", "right")}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((s) => (
            <tr key={s.id} className="hover:bg-surface/60">
              <td className="px-3 py-2.5">
                <a
                  href={`/s/${s.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {s.name}
                </a>
                <span className="block font-mono text-xs text-muted">
                  /{s.slug}
                  {s.paused && " · paused"}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <PlanCell
                  tenantId={s.id}
                  planStatus={s.planStatus}
                  trialEndsAt={s.trialEndsAt}
                />
              </td>
              <td className="px-3 py-2.5 text-right text-xs text-muted">{fmtDate(s.createdAt)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.orders}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{s.currency} {nfmt(s.gmv)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{s.customers}</td>
              <td className="px-3 py-2.5 text-right text-xs text-muted">{relative(s.lastOrderAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
