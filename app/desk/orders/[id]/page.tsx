import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { getOrderDetail } from "@/lib/orders";
import { PageHeader } from "@/components/desk/ui";
import { OrderDetailBody } from "@/components/orders/order-detail-body";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireActive();
  const { id } = await params;
  const [order, tenant] = await Promise.all([
    getOrderDetail(ctx, id),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);
  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={new Date(order.createdAt).toLocaleString()}
        actions={
          <>
            <a
              href={`/invoice/${id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50"
            >
              Print invoice
            </a>
            <Link href="/desk/orders" className="text-xs text-accent hover:underline">
              ← All orders
            </Link>
          </>
        }
      />
      <OrderDetailBody order={order} currency={tenant?.currency ?? ""} />
    </>
  );
}
