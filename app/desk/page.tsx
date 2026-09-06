import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import type { OrderStatus } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { dashboardMetrics } from "@/lib/dashboard";
import { listOrders } from "@/lib/orders";
import { upsellState } from "@/lib/upsell";
import { StatusPill, relativeTime } from "@/components/orders/status-pill";
import { UpsellBanner } from "@/components/desk/upsell-banner";
import { PageHeader, Card, StatCard, BtnLink, EmptyState, Table, Th, Td } from "@/components/desk/ui";

const PIPELINE: { status: OrderStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

export default async function DashboardPage() {
  const ctx = await requireActive();
  const [m, recent, tenant, upsell] = await Promise.all([
    dashboardMetrics(ctx),
    listOrders(ctx, {}),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    upsellState(ctx),
  ]);
  const currency = tenant?.currency ?? "";

  return (
    <>
      {upsell.show && <UpsellBanner reason={upsell.reason} />}

      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${tenant?.name ?? "your shop"}`}
        actions={<BtnLink href="/desk/orders/new">+ New order</BtnLink>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Needs action"
          value={m.needsAction}
          hint="Confirmed + packed"
          href="/desk/orders?tab=needs-action"
          tone={m.needsAction > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Open orders"
          value={m.openOrders}
          hint={`${currency} ${m.openValue} in flight`}
          href="/desk/orders?tab=open"
        />
        <StatCard
          label="Delivered"
          value={m.deliveredCount}
          hint={`${currency} ${m.deliveredValue} total`}
          href="/desk/orders?tab=delivered"
          tone="accent"
        />
        <StatCard
          label="Low stock"
          value={m.lowStockCount}
          hint={`${m.customerCount} customers`}
          href="/desk/catalog"
          tone={m.lowStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <Card title="Pipeline" actions={<Link href="/desk/board" className="text-xs text-accent hover:underline">Board →</Link>}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PIPELINE.map((p) => (
            <Link
              key={p.status}
              href={`/desk/orders?tab=all`}
              className="rounded-lg border border-line bg-surface px-3 py-3 text-center transition-colors hover:border-accent/50"
            >
              <p className="text-lg font-semibold tabular-nums">{m.countsByStatus[p.status] ?? 0}</p>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                {p.label}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title="Recent orders"
        bodyClassName="p-0"
        actions={<Link href="/desk/orders" className="text-xs text-accent hover:underline">All orders →</Link>}
      >
        {recent.length === 0 ? (
          <div className="p-4">
            <EmptyState>No orders yet. Create your first one to see it here.</EmptyState>
          </div>
        ) : (
          <Table>
            <thead className="border-b border-line bg-surface">
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
                <Th className="text-right">Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.slice(0, 8).map((o) => (
                <tr key={o.id} className="hover:bg-surface/60">
                  <Td>
                    <Link href={`/desk/orders/${o.id}`} className="font-mono text-xs text-accent hover:underline">
                      #{o.orderNumber}
                    </Link>
                  </Td>
                  <Td className="font-medium">{o.customerName}</Td>
                  <Td className="text-right tabular-nums">{currency} {o.total}</Td>
                  <Td><StatusPill status={o.status} /></Td>
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
