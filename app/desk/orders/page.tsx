import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import type { OrderStatus, DeliveryStatus, PaymentStatus } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { listOrders } from "@/lib/orders";
import { PageHeader, Card, BtnLink, EmptyState } from "@/components/desk/ui";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { Pager } from "@/components/desk/pager";

type SP = {
  q?: string;
  status?: string;
  delivery?: string;
  payment?: string;
  from?: string;
  to?: string;
  page?: string;
};

const PAGE_SIZE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireActive();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total }, tenant] = await Promise.all([
    listOrders(ctx, {
      search: sp.q,
      statuses: sp.status ? [sp.status as OrderStatus] : undefined,
      deliveryStatuses: sp.delivery ? [sp.delivery as DeliveryStatus] : undefined,
      paymentStatuses: sp.payment ? [sp.payment as PaymentStatus] : undefined,
      from: sp.from,
      to: sp.to,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);
  const currency = tenant?.currency ?? "";
  const hasFilters = Boolean(
    sp.q || sp.status || sp.delivery || sp.payment || sp.from || sp.to,
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = (page - 1) * PAGE_SIZE + rows.length;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={total > 0 ? `${from}–${to} of ${total}` : "None yet"}
        actions={<BtnLink href="/desk/orders/new">+ New order</BtnLink>}
      />

      <OrderFilters />

      <Card bodyClassName="p-0">
        {rows.length === 0 && total > 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted">
            <p>Nothing on this page.</p>
            <Pager page={page} pageCount={pageCount} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            {hasFilters ? (
              <EmptyState>No orders match. Adjust the filters, or hit &ldquo;+ New order&rdquo;.</EmptyState>
            ) : (
              <EmptyState
                title="No orders yet"
                action={<BtnLink href="/desk/orders/new">Create an order</BtnLink>}
              >
                Add one by hand, or share your storefront link and let customers send
                theirs straight to your DMs.
              </EmptyState>
            )}
          </div>
        ) : (
          <>
            <OrdersTable rows={rows} currency={currency} />
            {pageCount > 1 && (
              <div className="border-t border-line p-3">
                <Pager page={page} pageCount={pageCount} />
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
