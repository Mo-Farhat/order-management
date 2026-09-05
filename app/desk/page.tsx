import Link from "next/link";
import { requireActive } from "@/lib/session";
import { listOrders, orderCountsByStatus, NEEDS_ACTION } from "@/lib/orders";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import type { OrderStatus } from "@/db/schema";
import { StatusPill, relativeTime } from "@/components/orders/status-pill";
import { OrderSearch } from "@/components/orders/order-search";

const TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "needs-action", label: "Needs action", statuses: NEEDS_ACTION },
  { key: "draft", label: "Draft", statuses: ["draft"] },
  { key: "open", label: "Open", statuses: ["draft", "confirmed", "packed", "shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "all", label: "All" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const ctx = await requireActive();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  const [rows, counts, tenant] = await Promise.all([
    listOrders(ctx, { statuses: tab.statuses, search: sp.q }),
    orderCountsByStatus(ctx),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);
  const currency = tenant?.currency ?? "";
  const needsAction = (counts.confirmed ?? 0) + (counts.packed ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Orders</h2>
        <Link
          href="/desk/orders/new"
          className="inline-flex h-9 items-center rounded-full bg-ink px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-paper"
        >
          + New order
        </Link>
      </div>

      <OrderSearch defaultQuery={sp.q ?? ""} />

      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/desk?tab=${t.key}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest ${
              t.key === tab.key ? "border-ink text-ink" : "border-transparent text-muted"
            }`}
          >
            {t.label}
            {t.key === "needs-action" && needsAction > 0 && (
              <span className="ml-1 rounded-full bg-lime/50 px-1.5 text-ink">{needsAction}</span>
            )}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {sp.q ? "No orders match that." : "No orders here yet — your first one will show up here."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/desk/orders/${o.id}`} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted">#{o.orderNumber}</span>
                    <span className="truncate text-sm font-medium">{o.customerName}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {currency} {o.total} ·{" "}
                    {relativeTime(o.updatedAt)}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/desk/board" className="self-start text-xs text-muted underline underline-offset-4">
        Board view →
      </Link>
    </div>
  );
}
