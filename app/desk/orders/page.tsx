import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { listOrders, orderCountsByStatus, NEEDS_ACTION } from "@/lib/orders";
import { relativeTime } from "@/components/orders/status-pill";
import { OrderSearch } from "@/components/orders/order-search";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { PageHeader, Card, BtnLink, EmptyState, Table, Th, Td } from "@/components/desk/ui";

const TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "needs-action", label: "Needs action", statuses: NEEDS_ACTION },
  { key: "draft", label: "Draft", statuses: ["draft"] },
  { key: "open", label: "Open", statuses: ["draft", "confirmed", "packed", "shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "all", label: "All" },
];

const PAY: Record<PaymentStatus, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "text-muted" },
  partial: { label: "Partial", cls: "text-warn" },
  paid: { label: "Paid", cls: "text-accent" },
};

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
  const qs = sp.q ? `&q=${encodeURIComponent(sp.q)}` : "";

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${rows.length} shown`}
        actions={<BtnLink href="/desk/orders/new">+ New order</BtnLink>}
      />

      <OrderSearch defaultQuery={sp.q ?? ""} />

      <Card bodyClassName="p-0">
        <div className="flex gap-1 overflow-x-auto border-b border-line px-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/desk/orders?tab=${t.key}${qs}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest ${
                t.key === tab.key
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {t.key === "needs-action" && needsAction > 0 && (
                <span className="ml-1.5 rounded-full bg-warn px-1.5 text-[10px] text-white">
                  {needsAction}
                </span>
              )}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState>
              {sp.q
                ? "No orders match that."
                : "No orders here yet. Hit “+ New order” to create one."}
            </EmptyState>
          </div>
        ) : (
          <Table>
            <thead className="border-b border-line bg-surface">
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th className="text-right">Items</Th>
                <Th className="text-right">Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th className="text-right">Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-surface/60">
                  <Td>
                    <Link
                      href={`/desk/orders/${o.id}`}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      #{o.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/desk/orders/${o.id}`} className="font-medium hover:underline">
                      {o.customerName}
                    </Link>
                    {o.customerPhone && (
                      <span className="block text-xs text-muted">{o.customerPhone}</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums text-muted">{o.itemCount}</Td>
                  <Td className="text-right tabular-nums">{currency} {o.total}</Td>
                  <Td>
                    <span className={`font-mono text-[10px] font-semibold uppercase tracking-wide ${PAY[o.paymentStatus].cls}`}>
                      {PAY[o.paymentStatus].label}
                    </span>
                  </Td>
                  <Td>
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                  </Td>
                  <Td className="text-right text-xs text-muted">{relativeTime(o.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
