import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getOrder, TERMINAL } from "@/lib/orders";
import { listProducts } from "@/lib/catalog";
import { editOrderAction } from "@/app/actions/orders";
import { EditOrderFlow } from "@/components/orders/edit-order-flow";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireActive();
  const { id } = await params;
  const data = await getOrder(ctx, id);
  if (!data) notFound();

  const { order, customer, items } = data;
  const blocked =
    TERMINAL.includes(order.status) ||
    (order.status === "completed" && !can(ctx.role, "order:edit_past_confirmed"));
  if (blocked) redirect(`/desk/orders/${id}`);

  const [productItems, tenant] = await Promise.all([
    listProducts(ctx, {}),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/desk/orders/${id}`}
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Order #{order.orderNumber}
      </Link>
      <EditOrderFlow
        orderId={id}
        products={productItems.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stockQty: p.stockQty,
          photoUrl: p.photoUrl,
        }))}
        currency={tenant?.currency ?? ""}
        stockTracking={tenant?.stockTrackingEnabled ?? true}
        action={editOrderAction.bind(null, id)}
        initial={{
          customer: {
            id: customer?.id ?? null,
            name: customer?.name ?? "",
            phone: customer?.phone ?? "",
          },
          deliveryAddress: order.deliveryAddress ?? "",
          courier: order.courier ?? "",
          items: items.map((it) => ({
            productId: it.productId ?? "",
            quantity: it.quantity,
            note: it.note ?? undefined,
          })),
          deliveryFee: order.deliveryFee,
          discountType: order.discountType,
          discountValue: order.discountValue,
          paymentStatus: order.paymentStatus,
          amountPaid: order.amountPaid,
          note: order.note ?? "",
        }}
      />
    </div>
  );
}
