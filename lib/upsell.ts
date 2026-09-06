import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, tenants } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

const ORDER_THRESHOLD = 50;
const PRODUCT_THRESHOLD = 30;
const AGE_DAYS_THRESHOLD = 90;
const SNOOZE_DAYS = 60; // FR-23: a dismissed banner reappears after 60 days

/**
 * FR-23: the "you've outgrown the share link — time for a real website" banner.
 * Shows once a usage threshold is crossed, is dismissible, and comes back after
 * 60 days. Never blocks a workflow.
 */
export async function upsellState(
  ctx: ActiveContext,
): Promise<{ show: boolean; reason: string }> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, ctx.tenantId),
    columns: { createdAt: true, upsellDismissedAt: true },
  });
  if (!tenant) return { show: false, reason: "" };

  if (tenant.upsellDismissedAt) {
    const snoozeUntil = tenant.upsellDismissedAt.getTime() + SNOOZE_DAYS * 86_400_000;
    if (Date.now() < snoozeUntil) return { show: false, reason: "" };
  }

  const [[orderAgg], [productAgg]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.tenantId, ctx.tenantId)),
    db
      .select({ n: count() })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.archivedAt))),
  ]);

  const orderCount = Number(orderAgg?.n ?? 0);
  const productCount = Number(productAgg?.n ?? 0);
  const ageDays = (Date.now() - tenant.createdAt.getTime()) / 86_400_000;

  if (orderCount >= ORDER_THRESHOLD) {
    return { show: true, reason: `You've taken ${orderCount} orders here.` };
  }
  if (productCount >= PRODUCT_THRESHOLD) {
    return { show: true, reason: `You're running a ${productCount}-product catalog.` };
  }
  if (ageDays >= AGE_DAYS_THRESHOLD) {
    return { show: true, reason: `You've been running the desk for ${Math.floor(ageDays)} days.` };
  }
  return { show: false, reason: "" };
}
