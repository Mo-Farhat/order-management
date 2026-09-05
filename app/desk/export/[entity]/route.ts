import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderItems, orders, products } from "@/db/schema";
import { requireActive } from "@/lib/session";

/** FR-14: self-serve CSV export of customers / products / orders. */

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const ctx = await requireActive();
  const { entity } = await params;

  let filename: string;
  let csv: string;

  if (entity === "customers") {
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, ctx.tenantId))
      .orderBy(desc(customers.createdAt));
    filename = "customers.csv";
    csv = toCsv(
      ["name", "phone", "created_at"],
      rows.map((r) => [r.name, r.phone, r.createdAt.toISOString()]),
    );
  } else if (entity === "products") {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.tenantId, ctx.tenantId))
      .orderBy(desc(products.createdAt));
    filename = "products.csv";
    csv = toCsv(
      ["name", "price", "stock", "category", "sku", "low_stock_threshold", "archived"],
      rows.map((r) => [
        r.name,
        r.price,
        r.stockQty,
        r.category ?? "",
        r.sku ?? "",
        r.lowStockThreshold ?? "",
        r.archivedAt ? "yes" : "no",
      ]),
    );
  } else if (entity === "orders") {
    const rows = await db
      .select({
        orderNumber: orders.orderNumber,
        status: orders.status,
        customerName: customers.name,
        customerPhone: customers.phone,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        total: orders.total,
        note: orders.note,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orders.tenantId, ctx.tenantId))
      .orderBy(desc(orders.orderNumber));

    const lines = await db
      .select({ orderId: orderItems.orderId, name: orderItems.nameSnapshot, qty: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.tenantId, ctx.tenantId));
    const itemsByOrder = new Map<number, string>();
    // note: join above dropped orderId; re-query minimal map keyed by number is overkill,
    // so summarise items separately keyed by order number via a second pass
    const numById = await db
      .select({ id: orders.id, n: orders.orderNumber })
      .from(orders)
      .where(eq(orders.tenantId, ctx.tenantId));
    const nById = new Map(numById.map((r) => [r.id, r.n]));
    for (const l of lines) {
      const n = nById.get(l.orderId);
      if (n == null) continue;
      itemsByOrder.set(n, `${itemsByOrder.get(n) ?? ""}${l.name} x${l.qty}; `);
    }

    filename = "orders.csv";
    csv = toCsv(
      ["order_number", "status", "customer", "phone", "items", "subtotal", "delivery_fee", "total", "note", "created_at"],
      rows.map((r) => [
        r.orderNumber,
        r.status,
        r.customerName,
        r.customerPhone,
        (itemsByOrder.get(r.orderNumber) ?? "").trim(),
        r.subtotal,
        r.deliveryFee,
        r.total,
        r.note ?? "",
        r.createdAt.toISOString(),
      ]),
    );
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
