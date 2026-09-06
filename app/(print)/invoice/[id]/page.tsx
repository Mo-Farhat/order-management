import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { getOrderDetail } from "@/lib/orders";
import { toCents, fromCents } from "@/lib/money";
import { PrintButton } from "@/components/orders/print-button";

export default async function InvoicePage({
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

  const cur = tenant?.currency ?? "";
  const balance = Math.max(0, toCents(order.total) - toCents(order.amountPaid));
  const d = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 text-sm">
      <style>{`@media print { .no-print { display: none !important } @page { margin: 16mm } }`}</style>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name ?? "Invoice"}</h1>
          {tenant?.whatsappNumber && <p className="text-neutral-600">{tenant.whatsappNumber}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">INVOICE</p>
          <p className="font-mono">#{order.orderNumber}</p>
          <p className="text-neutral-600">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 border-y border-neutral-300 py-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Bill to</p>
          <p className="font-medium">{order.customer?.name}</p>
          {order.customer?.phone && <p>{order.customer.phone}</p>}
          {order.customer?.address && (
            <p className="whitespace-pre-line text-neutral-600">{order.customer.address}</p>
          )}
        </div>
        <div className="text-right">
          <p><span className="text-neutral-500">Order status:</span> {order.status}</p>
          <p><span className="text-neutral-500">Payment:</span> {order.paymentStatus}</p>
          <p><span className="text-neutral-500">Delivery:</span> {order.deliveryStatus}</p>
          {order.courier && <p><span className="text-neutral-500">Courier:</span> {order.courier}</p>}
          <p><span className="text-neutral-500">Dispatched:</span> {d(order.dispatchedAt)}</p>
          <p><span className="text-neutral-500">Delivered:</span> {d(order.deliveredAt)}</p>
        </div>
      </div>

      <table className="mb-6 w-full">
        <thead>
          <tr className="border-b border-neutral-400 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2">#</th>
            <th className="py-2">Product</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={it.id} className="border-b border-neutral-200">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{it.name}</td>
              <td className="py-2 text-right">{it.quantity}</td>
              <td className="py-2 text-right">{cur} {it.unitPrice}</td>
              <td className="py-2 text-right">{cur} {it.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 text-right">
        <Line k="Subtotal" v={`${cur} ${order.subtotal}`} />
        {order.discountType !== "none" && (
          <Line
            k={`Discount${order.discountType === "percent" ? ` (${order.discountValue}%)` : ""}`}
            v="(−)"
          />
        )}
        {Number(order.deliveryFee) > 0 && <Line k="Delivery fee" v={`${cur} ${order.deliveryFee}`} />}
        <Line k="Total" v={`${cur} ${order.total}`} bold />
        <Line k="Paid" v={`${cur} ${order.amountPaid}`} />
        <Line k="Balance due" v={`${cur} ${fromCents(balance)}`} bold />
      </div>

      {order.note && (
        <div className="mt-8 border-t border-neutral-300 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Note</p>
          <p className="whitespace-pre-line">{order.note}</p>
        </div>
      )}

      <div className="no-print mt-10 flex gap-3">
        <PrintButton />
      </div>
    </div>
  );
}

function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${bold ? "border-t border-neutral-300 font-semibold" : ""}`}>
      <span className="text-neutral-500">{k}</span>
      <span>{v}</span>
    </div>
  );
}
