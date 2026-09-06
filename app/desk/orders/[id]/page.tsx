import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { can } from "@/lib/rbac";
import { canAdvance, canCancel, canReturn, getOrder, TERMINAL } from "@/lib/orders";
import { StatusPill } from "@/components/orders/status-pill";
import { OrderActions } from "@/components/orders/order-actions";
import { OrderNote } from "@/components/orders/order-note";
import { PaymentEditor } from "@/components/orders/payment-editor";
import { PageHeader, Card } from "@/components/desk/ui";

const EVENT_LABEL: Record<
  string,
  (e: { fromStatus: string | null; toStatus: string | null; note: string | null }) => string
> = {
  created: (e) => `Order created${e.toStatus === "confirmed" ? " and confirmed" : " as draft"}`,
  status: (e) => `${e.fromStatus ?? "?"} → ${e.toStatus ?? "?"}`,
  note: () => "Note updated",
  edited: () => "Order edited",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireActive();
  const { id } = await params;
  const data = await getOrder(ctx, id);
  if (!data) notFound();

  const { order, customer, items, events } = data;
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) });
  const currency = tenant?.currency ?? "";
  const wa = customer?.phone ? customer.phone.replace(/[^0-9]/g, "") : "";

  const editable =
    !TERMINAL.includes(order.status) &&
    order.status !== "delivered" &&
    (order.status === "draft" || can(ctx.role, "order:edit_past_confirmed"));

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={new Date(order.createdAt).toLocaleString()}
        actions={
          <>
            <StatusPill status={order.status} />
            {editable && (
              <Link
                href={`/desk/orders/${order.id}/edit`}
                className="text-xs text-accent hover:underline"
              >
                Edit items &amp; fees
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Items" bodyClassName="p-0">
            <div className="divide-y divide-line text-sm">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between gap-2 px-4 py-3">
                  <span className="flex-1 truncate">
                    {it.nameSnapshot} <span className="text-muted">× {it.quantity}</span>
                  </span>
                  <span className="text-muted">{currency} {it.priceSnapshot}</span>
                  <span className="w-24 text-right tabular-nums">{currency} {it.lineTotal}</span>
                </div>
              ))}
              <div className="flex flex-col gap-0.5 px-4 py-3 text-muted">
                <Row label="Subtotal" value={`${currency} ${order.subtotal}`} />
                {order.discountType !== "none" && (
                  <Row
                    label={`Discount (${order.discountType === "percent" ? `${order.discountValue}%` : "flat"})`}
                    value=""
                  />
                )}
                {Number(order.deliveryFee) > 0 && (
                  <Row label="Delivery" value={`${currency} ${order.deliveryFee}`} />
                )}
                <div className="mt-1 flex justify-between border-t border-line pt-2 font-semibold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{currency} {order.total}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Actions">
            <OrderActions
              orderId={order.id}
              status={order.status}
              canAdvance={canAdvance(order.status) && can(ctx.role, "order:advance")}
              canCancel={canCancel(order.status) && can(ctx.role, "order:advance")}
              canReturn={canReturn(order.status) && can(ctx.role, "order:advance")}
            />
          </Card>

          <Card title="Payment">
            <PaymentEditor
              orderId={order.id}
              paymentStatus={order.paymentStatus}
              amountPaid={order.amountPaid}
              total={order.total}
              currency={currency}
            />
          </Card>

          <Card title="Note">
            <OrderNote orderId={order.id} note={order.note ?? ""} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {customer && (
            <Card title="Customer">
              <p className="font-medium">{customer.name}</p>
              {customer.phone && <p className="text-sm text-muted">{customer.phone}</p>}
              {order.deliveryAddress && (
                <p className="mt-2 whitespace-pre-line text-sm text-muted">{order.deliveryAddress}</p>
              )}
              {customer.phone && (
                <div className="mt-3 flex gap-3 text-xs">
                  <a href={`tel:${customer.phone}`} className="text-accent underline underline-offset-4">
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </Card>
          )}

          <Card title="Timeline" bodyClassName="p-0">
            <ul className="divide-y divide-line text-xs">
              {events.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 px-4 py-3">
                  <span>
                    {EVENT_LABEL[e.kind]?.(e) ?? e.kind}
                    {e.note ? ` — ${e.note}` : ""}
                  </span>
                  <span className="text-muted">{new Date(e.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
