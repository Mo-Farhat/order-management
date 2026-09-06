import "server-only";
import { and, desc, eq, gte, inArray, lte, or, sql, count } from "drizzle-orm";

import { db } from "@/db";
import { withTenant, type Tx } from "@/db/tenant";
import {
  auditLog,
  customers,
  orderEvents,
  orderItems,
  orders,
  products,
  stockMovements,
  tenants,
  type Order,
  type OrderStatus,
  type DeliveryStatus,
  type PaymentStatus,
} from "@/db/schema";
import { can } from "@/lib/rbac";
import { computeTotals, fromCents, toCents, type DiscountType } from "@/lib/money";
import {
  TERMINAL,
  shouldHoldStock,
  isValidOrderStatus,
  isValidDeliveryStatus,
} from "@/lib/pipeline";
import type { ActiveContext } from "@/lib/session";
import type { OrderDraftInput } from "@/lib/validation";

export {
  ORDER_STATUSES,
  DELIVERY_STATUSES,
  TERMINAL,
  ORDER_STATUS_LABEL,
  DELIVERY_STATUS_LABEL,
} from "@/lib/pipeline";

/** Whether this tenant decrements stock on confirm / restores it on cancel. */
async function stockTrackingOn(tx: Tx, tenantId: string): Promise<boolean> {
  const row = await tx.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { stockTrackingEnabled: true },
  });
  return row?.stockTrackingEnabled ?? true;
}

// --- Reads -----------------------------------------------------------

export type OrderListRow = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string | null;
  itemCount: number;
  firstItemName: string | null;
  total: string;
  amountPaid: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  courier: string | null;
  createdAt: Date;
  dispatchedAt: Date | null;
};

export type OrderFilters = {
  statuses?: OrderStatus[];
  deliveryStatuses?: DeliveryStatus[];
  paymentStatuses?: PaymentStatus[];
  search?: string;
  from?: string; // ISO date (sale date lower bound)
  to?: string;
};

export async function listOrders(
  ctx: ActiveContext,
  opts: OrderFilters = {},
): Promise<OrderListRow[]> {
  const filters = [eq(orders.tenantId, ctx.tenantId)];
  if (opts.statuses?.length) filters.push(inArray(orders.status, opts.statuses));
  if (opts.deliveryStatuses?.length) filters.push(inArray(orders.deliveryStatus, opts.deliveryStatuses));
  if (opts.paymentStatuses?.length) filters.push(inArray(orders.paymentStatus, opts.paymentStatuses));
  if (opts.from) filters.push(gte(orders.createdAt, new Date(opts.from)));
  if (opts.to) filters.push(lte(orders.createdAt, new Date(opts.to + "T23:59:59")));

  const term = opts.search?.trim();
  if (term) {
    const like = `%${term}%`;
    const asNumber = Number(term.replace(/^#/, ""));
    filters.push(
      Number.isInteger(asNumber)
        ? or(
            sql`${customers.name} ilike ${like}`,
            sql`${customers.phone} ilike ${like}`,
            eq(orders.orderNumber, asNumber),
          )!
        : or(sql`${customers.name} ilike ${like}`, sql`${customers.phone} ilike ${like}`)!,
    );
  }

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: customers.name,
      customerPhone: customers.phone,
      total: orders.total,
      amountPaid: orders.amountPaid,
      status: orders.status,
      deliveryStatus: orders.deliveryStatus,
      paymentStatus: orders.paymentStatus,
      courier: orders.courier,
      createdAt: orders.createdAt,
      dispatchedAt: orders.dispatchedAt,
      itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
      firstItemName: sql<string | null>`(select ${orderItems.nameSnapshot} from ${orderItems} where ${orderItems.orderId} = ${orders.id} order by ${orderItems.id} limit 1)`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(...filters))
    .orderBy(desc(orders.createdAt))
    .limit(300);

  return rows.map((r) => ({ ...r, itemCount: Number(r.itemCount) }));
}

export async function orderCountsByStatus(
  ctx: ActiveContext,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: orders.status, n: count() })
    .from(orders)
    .where(eq(orders.tenantId, ctx.tenantId))
    .groupBy(orders.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
}

export async function getOrder(ctx: ActiveContext, id: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.tenantId, ctx.tenantId)),
  });
  if (!order) return null;

  const [customer, items, events, actor] = await Promise.all([
    db.query.customers.findFirst({ where: eq(customers.id, order.customerId) }),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(desc(orderEvents.createdAt)),
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
  ]);

  return { order, customer: customer ?? null, items, events, tenant: actor ?? null };
}

export type OrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  courier: string | null;
  createdAt: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  customer: { name: string; phone: string | null; address: string | null } | null;
  items: { id: string; name: string; unitPrice: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  discountType: string;
  discountValue: string;
  deliveryFee: string;
  total: string;
  amountPaid: string;
  note: string | null;
  events: { id: string; kind: string; note: string | null; at: string; from: string | null; to: string | null }[];
};

export async function getOrderDetail(ctx: ActiveContext, id: string): Promise<OrderDetail | null> {
  const data = await getOrder(ctx, id);
  if (!data) return null;
  const { order, customer, items, events } = data;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryStatus: order.deliveryStatus,
    paymentStatus: order.paymentStatus,
    courier: order.courier,
    createdAt: order.createdAt.toISOString(),
    dispatchedAt: order.dispatchedAt ? order.dispatchedAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    customer: customer
      ? { name: customer.name, phone: customer.phone, address: order.deliveryAddress }
      : null,
    items: items.map((it) => ({
      id: it.id,
      name: it.nameSnapshot,
      unitPrice: it.priceSnapshot,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
    })),
    subtotal: order.subtotal,
    discountType: order.discountType,
    discountValue: order.discountValue,
    deliveryFee: order.deliveryFee,
    total: order.total,
    amountPaid: order.amountPaid,
    note: order.note,
    events: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      note: e.note,
      at: e.createdAt.toISOString(),
      from: e.fromStatus,
      to: e.toStatus,
    })),
  };
}

export async function searchCustomers(ctx: ActiveContext, term: string) {
  const t = term.trim();
  if (!t) return [];
  const like = `%${t}%`;
  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      lastOrderAt: sql<Date | null>`(select max(${orders.createdAt}) from ${orders} where ${orders.customerId} = ${customers.id})`,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, ctx.tenantId),
        or(sql`${customers.phone} ilike ${like}`, sql`${customers.name} ilike ${like}`),
      ),
    )
    .limit(8);
}

// --- Writes ----------------------------------------------------------

async function resolveCustomer(
  tx: Tx,
  ctx: ActiveContext,
  input: OrderDraftInput,
): Promise<string> {
  if (input.customerId) {
    const existing = await tx.query.customers.findFirst({
      where: and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId)),
    });
    if (!existing) throw new Error("That customer no longer exists.");
    return existing.id;
  }

  const phone = input.customerPhone?.trim() || null;
  const name = input.customerName?.trim();
  if (!name) throw new Error("Enter a customer name.");

  if (phone) {
    const match = await tx.query.customers.findFirst({
      where: and(eq(customers.tenantId, ctx.tenantId), eq(customers.phone, phone)),
    });
    if (match) {
      if (match.name !== name) {
        await tx
          .update(customers)
          .set({ name, updatedAt: new Date() })
          .where(eq(customers.id, match.id));
      }
      return match.id;
    }
  }

  const [created] = await tx
    .insert(customers)
    .values({ tenantId: ctx.tenantId, phone, name })
    .returning({ id: customers.id });
  return created.id;
}

type PricedItem = {
  productId: string;
  nameSnapshot: string;
  priceCents: number;
  quantity: number;
};

async function priceItems(
  tx: Tx,
  ctx: ActiveContext,
  items: { productId: string; quantity: number }[],
): Promise<PricedItem[]> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const rows = await tx
    .select()
    .from(products)
    .where(and(eq(products.tenantId, ctx.tenantId), inArray(products.id, ids)));
  const byId = new Map(rows.map((r) => [r.id, r]));

  return items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("One of the products is no longer in your catalog.");
    return {
      productId: p.id,
      nameSnapshot: p.name,
      priceCents: toCents(p.price),
      quantity: i.quantity,
    };
  });
}

function money(input: {
  priced: PricedItem[];
  deliveryFee?: string;
  discountType: DiscountType;
  discountValue?: string;
}) {
  const discountValue =
    input.discountType === "percent"
      ? Number(input.discountValue || "0")
      : toCents(input.discountValue || "0");
  return computeTotals({
    items: input.priced,
    deliveryFeeCents: toCents(input.deliveryFee || "0"),
    discountType: input.discountType,
    discountValue,
  });
}

async function commitStock(
  tx: Tx,
  ctx: ActiveContext,
  orderId: string,
  items: { productId: string; quantity: number }[],
) {
  for (const item of items) {
    const [p] = await tx
      .select({ stockQty: products.stockQty })
      .from(products)
      .where(and(eq(products.id, item.productId), eq(products.tenantId, ctx.tenantId)));
    if (!p) continue;
    const next = p.stockQty - item.quantity;
    await tx
      .update(products)
      .set({ stockQty: next, updatedAt: new Date() })
      .where(eq(products.id, item.productId));
    await tx.insert(stockMovements).values({
      tenantId: ctx.tenantId,
      productId: item.productId,
      delta: -item.quantity,
      balanceAfter: next,
      reason: "order_confirmed",
      orderId,
      actorUserId: ctx.userId,
    });
  }
}

async function restoreStock(tx: Tx, ctx: ActiveContext, orderId: string) {
  const committed = await tx
    .select({ productId: stockMovements.productId, delta: stockMovements.delta })
    .from(stockMovements)
    .where(and(eq(stockMovements.orderId, orderId), eq(stockMovements.reason, "order_confirmed")));
  const restoredAlready = await tx
    .select({ productId: stockMovements.productId, delta: stockMovements.delta })
    .from(stockMovements)
    .where(and(eq(stockMovements.orderId, orderId), eq(stockMovements.reason, "order_cancelled")));

  const net = new Map<string, number>();
  for (const m of committed) net.set(m.productId, (net.get(m.productId) ?? 0) + m.delta);
  for (const m of restoredAlready) net.set(m.productId, (net.get(m.productId) ?? 0) + m.delta);

  for (const [productId, delta] of net) {
    if (delta >= 0) continue;
    const restoreQty = -delta;
    const [p] = await tx
      .select({ stockQty: products.stockQty })
      .from(products)
      .where(eq(products.id, productId));
    if (!p) continue;
    const next = p.stockQty + restoreQty;
    await tx.update(products).set({ stockQty: next, updatedAt: new Date() }).where(eq(products.id, productId));
    await tx.insert(stockMovements).values({
      tenantId: ctx.tenantId,
      productId,
      delta: restoreQty,
      balanceAfter: next,
      reason: "order_cancelled",
      orderId,
      actorUserId: ctx.userId,
    });
  }
}

export async function createOrder(
  ctx: ActiveContext,
  input: OrderDraftInput,
): Promise<{ id: string; orderNumber: number }> {
  return withTenant(ctx.tenantId, async (tx) => {
    const customerId = await resolveCustomer(tx, ctx, input);
    const priced = await priceItems(tx, ctx, input.items);
    const totals = money({
      priced,
      deliveryFee: input.deliveryFee,
      discountType: input.discountType,
      discountValue: input.discountValue,
    });

    const [seq] = await tx
      .update(tenants)
      .set({ nextOrderNumber: sql`${tenants.nextOrderNumber} + 1` })
      .where(eq(tenants.id, ctx.tenantId))
      .returning({ orderNumber: tenants.nextOrderNumber });
    const orderNumber = seq.orderNumber - 1;

    // Every order is Confirmed on creation (no Draft state). Stock commits now.
    const commit = await stockTrackingOn(tx, ctx.tenantId);

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId: ctx.tenantId,
        orderNumber,
        customerId,
        status: "confirmed",
        deliveryStatus: "pending",
        courier: input.courier?.trim() || null,
        deliveryFee: fromCents(toCents(input.deliveryFee || "0")),
        discountType: input.discountType,
        discountValue:
          input.discountType === "percent"
            ? String(Number(input.discountValue || "0"))
            : fromCents(toCents(input.discountValue || "0")),
        subtotal: fromCents(totals.subtotalCents),
        total: fromCents(totals.totalCents),
        deliveryAddress: input.deliveryAddress?.trim() || null,
        paymentStatus: input.paymentStatus ?? "unpaid",
        amountPaid: fromCents(toCents(input.amountPaid || "0")),
        note: input.note?.trim() || null,
        stockCommitted: commit,
        createdBy: ctx.userId,
      })
      .returning();

    await tx.insert(orderItems).values(
      priced.map((p, i) => ({
        tenantId: ctx.tenantId,
        orderId: order.id,
        productId: p.productId,
        nameSnapshot: p.nameSnapshot,
        priceSnapshot: fromCents(p.priceCents),
        quantity: p.quantity,
        lineTotal: fromCents(totals.lineTotalsCents[i]),
      })),
    );

    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: order.id,
      kind: "created",
      toStatus: "confirmed",
      actorUserId: ctx.userId,
    });

    if (commit) await commitStock(tx, ctx, order.id, input.items);

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "order.created",
      entity: "order",
      entityId: order.id,
      after: { orderNumber, total: fromCents(totals.totalCents) },
    });

    return { id: order.id, orderNumber };
  });
}

export class OrderTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

async function loadForWrite(tx: Tx, ctx: ActiveContext, id: string): Promise<Order> {
  const order = await tx.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.tenantId, ctx.tenantId)),
  });
  if (!order) throw new OrderTransitionError("Order not found.");
  return order;
}

/** Free choice among the active order statuses; reconciles stock via the hold rule. */
export async function setOrderStatus(
  ctx: ActiveContext,
  id: string,
  to: OrderStatus,
  note?: string,
): Promise<void> {
  if (!isValidOrderStatus(to)) throw new OrderTransitionError(`Unknown order status "${to}".`);
  await withTenant(ctx.tenantId, async (tx) => {
    const order = await loadForWrite(tx, ctx, id);
    const from = order.status;
    if (from === to) return;

    let stockCommitted = order.stockCommitted;
    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    const known = items.filter(
      (i): i is { productId: string; quantity: number } => !!i.productId,
    );

    if (shouldHoldStock(to) && !stockCommitted && (await stockTrackingOn(tx, ctx.tenantId))) {
      await commitStock(tx, ctx, id, known);
      stockCommitted = true;
    }
    if (!shouldHoldStock(to) && stockCommitted) {
      await restoreStock(tx, ctx, id);
      stockCommitted = false;
    }

    await tx
      .update(orders)
      .set({ status: to, stockCommitted, updatedAt: new Date() })
      .where(eq(orders.id, id));

    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: id,
      kind: "status",
      fromStatus: from,
      toStatus: to,
      note: note?.trim() || null,
      actorUserId: ctx.userId,
    });
    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "order.status_changed",
      entity: "order",
      entityId: id,
      before: { status: from },
      after: { status: to },
    });
  });
}

export async function setDeliveryStatus(
  ctx: ActiveContext,
  id: string,
  to: DeliveryStatus,
): Promise<void> {
  if (!isValidDeliveryStatus(to)) throw new OrderTransitionError(`Unknown delivery status "${to}".`);
  await withTenant(ctx.tenantId, async (tx) => {
    const order = await loadForWrite(tx, ctx, id);
    if (order.deliveryStatus === to) return;

    const patch: Partial<typeof orders.$inferInsert> = {
      deliveryStatus: to,
      updatedAt: new Date(),
    };
    if (to === "dispatched" && !order.dispatchedAt) patch.dispatchedAt = new Date();
    if (to === "delivered") {
      if (!order.dispatchedAt) patch.dispatchedAt = new Date();
      if (!order.deliveredAt) patch.deliveredAt = new Date();
    }

    await tx.update(orders).set(patch).where(eq(orders.id, id));
    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: id,
      kind: "delivery",
      note: `Delivery ${order.deliveryStatus} → ${to}`,
      actorUserId: ctx.userId,
    });
  });
}

export async function setCourier(ctx: ActiveContext, id: string, courier: string): Promise<void> {
  await withTenant(ctx.tenantId, async (tx) => {
    await loadForWrite(tx, ctx, id);
    await tx
      .update(orders)
      .set({ courier: courier.trim() || null, updatedAt: new Date() })
      .where(eq(orders.id, id));
  });
}

/** Kept for back-compat with existing action names. */
export const moveOrder = setOrderStatus;
export async function cancelOrder(ctx: ActiveContext, id: string, reason?: string) {
  await setOrderStatus(ctx, id, "cancelled", reason);
}
export async function returnOrder(ctx: ActiveContext, id: string, reason?: string) {
  await setOrderStatus(ctx, id, "returned", reason);
}

export async function updatePayment(
  ctx: ActiveContext,
  id: string,
  paymentStatus: PaymentStatus,
  amountPaid: string,
) {
  await withTenant(ctx.tenantId, async (tx) => {
    await loadForWrite(tx, ctx, id);
    await tx
      .update(orders)
      .set({
        paymentStatus,
        amountPaid: fromCents(toCents(amountPaid || "0")),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: id,
      kind: "payment",
      note: `Payment ${paymentStatus}${Number(amountPaid) > 0 ? ` · ${amountPaid} paid` : ""}`,
      actorUserId: ctx.userId,
    });
  });
}

export async function updateOrderNote(ctx: ActiveContext, id: string, note: string) {
  await withTenant(ctx.tenantId, async (tx) => {
    await loadForWrite(tx, ctx, id);
    await tx
      .update(orders)
      .set({ note: note.trim() || null, updatedAt: new Date() })
      .where(eq(orders.id, id));
    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: id,
      kind: "note",
      note: note.trim() || "(cleared)",
      actorUserId: ctx.userId,
    });
  });
}

/** Editing a Completed / Cancelled / Returned order is blocked; Completed is owner-only. */
export async function editOrder(
  ctx: ActiveContext,
  id: string,
  input: OrderDraftInput,
): Promise<void> {
  await withTenant(ctx.tenantId, async (tx) => {
    const order = await loadForWrite(tx, ctx, id);
    if (TERMINAL.includes(order.status)) {
      throw new OrderTransitionError("This order is closed and can't be edited.");
    }
    if (order.status === "completed" && !can(ctx.role, "order:edit_past_confirmed")) {
      throw new OrderTransitionError("Only the owner can edit a completed order.");
    }

    const priced = await priceItems(tx, ctx, input.items);
    const totals = money({
      priced,
      deliveryFee: input.deliveryFee,
      discountType: input.discountType,
      discountValue: input.discountValue,
    });

    if (order.stockCommitted) await restoreStock(tx, ctx, id);

    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
    await tx.insert(orderItems).values(
      priced.map((p, i) => ({
        tenantId: ctx.tenantId,
        orderId: id,
        productId: p.productId,
        nameSnapshot: p.nameSnapshot,
        priceSnapshot: fromCents(p.priceCents),
        quantity: p.quantity,
        lineTotal: fromCents(totals.lineTotalsCents[i]),
      })),
    );

    if (order.stockCommitted) await commitStock(tx, ctx, id, input.items);

    await tx
      .update(orders)
      .set({
        deliveryFee: fromCents(toCents(input.deliveryFee || "0")),
        discountType: input.discountType,
        discountValue:
          input.discountType === "percent"
            ? String(Number(input.discountValue || "0"))
            : fromCents(toCents(input.discountValue || "0")),
        subtotal: fromCents(totals.subtotalCents),
        total: fromCents(totals.totalCents),
        deliveryAddress: input.deliveryAddress?.trim() || null,
        courier: input.courier?.trim() || order.courier,
        paymentStatus: input.paymentStatus ?? order.paymentStatus,
        amountPaid: fromCents(toCents(input.amountPaid || "0")),
        note: input.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await tx.insert(orderEvents).values({
      tenantId: ctx.tenantId,
      orderId: id,
      kind: "edited",
      actorUserId: ctx.userId,
      note: `Items/fees updated · new total ${fromCents(totals.totalCents)}`,
    });
  });
}
