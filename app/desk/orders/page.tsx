import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import type { OrderStatus, DeliveryStatus, PaymentStatus } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { listOrders } from "@/lib/orders";
import { PageHeader, Card, BtnLink, EmptyState } from "@/components/desk/ui";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrdersTable } from "@/components/orders/orders-table";

type SP = {
  q?: string;
  status?: string;
  delivery?: string;
  payment?: string;
  from?: string;
  to?: string;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireActive();
  const sp = await searchParams;

  const [rows, tenant] = await Promise.all([
    listOrders(ctx, {
      search: sp.q,
      statuses: sp.status ? [sp.status as OrderStatus] : undefined,
      deliveryStatuses: sp.delivery ? [sp.delivery as DeliveryStatus] : undefined,
      paymentStatuses: sp.payment ? [sp.payment as PaymentStatus] : undefined,
      from: sp.from,
      to: sp.to,
    }),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);
  const currency = tenant?.currency ?? "";

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${rows.length} shown`}
        actions={<BtnLink href="/desk/orders/new">+ New order</BtnLink>}
      />

      <OrderFilters />

      <Card bodyClassName="p-0">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState>No orders match. Adjust the filters, or hit &ldquo;+ New order&rdquo;.</EmptyState>
          </div>
        ) : (
          <OrdersTable rows={rows} currency={currency} />
        )}
      </Card>
    </>
  );
}
