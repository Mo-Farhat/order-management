import "server-only";
import { and, desc, eq, inArray, or, sql, count } from "drizzle-orm";

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
} from "@/db/schema";
import { can } from "@/lib/rbac";
import { computeTotals, fromCents, toCents, type DiscountType } from "@/lib/money";
import type { ActiveContext } from "@/lib/session";
import type { OrderDraftInput } from "@/lib/validation";

// --- Pipeline (FR-9) — pure logic lives in lib/pipeline.ts -------------

export {
  MAIN_NEXT,
  TERMINAL,
  NEEDS_ACTION,
  canAdvance,
  canCancel,
  canReturn,
  isLegalTransition,
} from "@/lib/pipeline";
import { MAIN_NEXT, TERMINAL, isLegalTransition } from "@/lib/pipeline";

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
  customerPhone: string;
  itemCount: number;
  total: string;
  status: OrderStatus;
  updatedAt: Date;
};

export async function listOrders(
  ctx: ActiveContext,
  opts: { statuses?: OrderStatus[]; search?: string } = {},
): Promise<OrderListRow[]> {
  const filters = [eq(orders.tenantId, ctx.tenantId)];
  if (opts.statuses?.length) filters.push(inArray(orders.status, opts.statuses));

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
      status: orders.status,
      updatedAt: orders.updatedAt,
      itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(...filters))
    .orderBy(desc(orders.updatedAt))
    .limit(200);

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

  const [customer, items, events] = await Promise.all([
    db.query.customers.findFirst({ where: eq(customers.id, order.customerId) }),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(desc(orderEvents.createdAt)),
  ]);

  return { order, customer: customer ?? null, items, events };
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

  const phone = input.customerPhone?.trim();
  const name = input.customerName?.trim();
  if (!phone || !name) throw new Error("Pick an existing customer or enter a name and phone.");

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
  // Sum what was committed for this order, restore it.
  const committed = await tx
    .select({ productId: stockMovements.productId, delta: stockMovements.delta })
    .from(stockMovements)
    .where(
      and(eq(stockMovements.orderId, orderId), eq(stockMovements.reason, "order_confirmed")),
    );
  const restoredAlready = await tx
    .select({ productId: stockMovements.productId, delta: stockMovements.delta })
    .from(stockMovements)
    .where(
      and(eq(stockMovements.orderId, orderId), eq(stockMovements.reason, "order_cancelled")),
    );

  const net = new Map<string, number>();
  for (const m of committed) net.set(m.productId, (net.get(m.productId) ?? 0) + m.delta);
  for (const m of restoredAlready) net.set(m.productId, (net.get(m.productId) ?? 0) + m.delta);

  for (const [productId, delta] of net) {
    if (delta >= 0) continue; // nothing outstanding to restore
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

    const status: OrderStatus = input.confirm ? "confirmed" : "draft";
    const commitOnConfirm = input.confirm && (await stockTrackingOn(tx, ctx.tenantId));

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId: ctx.tenantId,
        orderNumber,
        customerId,
        status,
        deliveryFee: fromCents(toCents(input.deliveryFee || "0")),
        discountType: input.discountType,
        discountValue:
          input.discountType === "percent"
            ? String(Number(input.discountValue || "0"))
            : fromCents(toCents(input.discountValue || "0")),
        subtotal: fromCents(totals.subtotalCents),
        total: fromCents(totals.totalCents),
        note: input.note?.trim() || null,
        stockCommitted: commitOnConfirm,
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
      toStatus: status,
      actorUserId: ctx.userId,
    });

    if (input.confirm) {
      if (commitOnConfirm) await commitStock(tx, ctx, order.id, input.items);
      await tx.insert(orderEvents).values({
        tenantId: ctx.tenantId,
        orderId: order.id,
        kind: "status",
        fromStatus: "draft",
        toStatus: "confirmed",
        actorUserId: ctx.userId,
      });
    }

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "order.created",
      entity: "order",
      entityId: order.id,
      after: { orderNumber, status, total: fromCents(totals.totalCents) },
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

async function transition(
  ctx: ActiveContext,
  id: string,
  to: OrderStatus,
  note?: string,
) {
  await withTenant(ctx.tenantId, async (tx) => {
    const order = await loadForWrite(tx, ctx, id);
    const from = order.status;
    if (from === to) return;

    if (!isLegalTransition(from, to)) {
      throw new OrderTransitionError(`Can't move an order from ${from} to ${to}.`);
    }

    let stockCommitted = order.stockCommitted;
    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    if (to === "confirmed" && !stockCommitted && (await stockTrackingOn(tx, ctx.tenantId))) {
      await commitStock(
        tx,
        ctx,
        id,
        items.filter((i): i is { productId: string; quantity: number } => !!i.productId),
      );
      stockCommitted = true;
    }
    if ((to === "cancelled" || to === "returned") && stockCommitted) {
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

export async function advanceOrder(ctx: ActiveContext, id: string): Promise<void> {
  const order = await getOrder(ctx, id);
  if (!order) throw new OrderTransitionError("Order not found.");
  const next = MAIN_NEXT[order.order.status];
  if (!next) throw new OrderTransitionError("This order is already at the end of the pipeline.");
  await transition(ctx, id, next);
}

export async function cancelOrder(ctx: ActiveContext, id: string, reason?: string) {
  await transition(ctx, id, "cancelled", reason);
}

export async function returnOrder(ctx: ActiveContext, id: string, reason?: string) {
  await transition(ctx, id, "returned", reason);
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

/**
 * FR-12: editing an order past Confirmed is Owner-only. When line items change
 * on a stock-committed order, stock is reconciled (restore old, re-commit new).
 */
export async function editOrder(
  ctx: ActiveContext,
  id: string,
  input: OrderDraftInput,
): Promise<void> {
  await withTenant(ctx.tenantId, async (tx) => {
    const order = await loadForWrite(tx, ctx, id);
    if (TERMINAL.includes(order.status) || order.status === "delivered") {
      throw new OrderTransitionError("This order is closed and can't be edited.");
    }
    if (order.status !== "draft" && !can(ctx.role, "order:edit_past_confirmed")) {
      throw new OrderTransitionError("Only the owner can edit an order past Draft.");
    }

    const priced = await priceItems(tx, ctx, input.items);
    const totals = money({
      priced,
      deliveryFee: input.deliveryFee,
      discountType: input.discountType,
      discountValue: input.discountValue,
    });

    if (order.stockCommitted) {
      await restoreStock(tx, ctx, id);
    }

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

    if (order.stockCommitted) {
      await commitStock(tx, ctx, id, input.items);
    }

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
