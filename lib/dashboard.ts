import "server-only";
import { and, eq, sql, count, isNull } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

export type DashboardMetrics = {
  needsAction: number; // confirmed + delivery still pending → needs dispatching
  openOrders: number; // status = confirmed
  openValue: string;
  completedCount: number;
  completedValue: string;
  outstandingValue: string; // total - amount_paid across non-paid orders
  customerCount: number;
  lowStockCount: number;
  pendingReview: number; // storefront orders awaiting accept/decline
  countsByStatus: Record<string, number>;
};

export async function dashboardMetrics(ctx: ActiveContext): Promise<DashboardMetrics> {
  const tid = eq(orders.tenantId, ctx.tenantId);
  const [statusRows, needsAgg, openAgg, doneAgg, outstandingAgg, customerAgg, lowStockAgg] =
    await Promise.all([
      db
        .select({ status: orders.status, n: count() })
        .from(orders)
        .where(tid)
        .groupBy(orders.status),
      db
        .select({ n: count() })
        .from(orders)
        .where(and(tid, eq(orders.status, "confirmed"), eq(orders.deliveryStatus, "pending"))),
      db
        .select({ n: count(), value: sql<string>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(and(tid, eq(orders.status, "confirmed"))),
      db
        .select({ n: count(), value: sql<string>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(and(tid, eq(orders.status, "completed"))),
      db
        .select({
          value: sql<string>`coalesce(sum(${orders.total}::numeric - ${orders.amountPaid}::numeric), 0)`,
        })
        .from(orders)
        .where(and(tid, sql`${orders.paymentStatus} <> 'paid'`, sql`${orders.status} <> 'cancelled'`)),
      db.select({ n: count() }).from(customers).where(eq(customers.tenantId, ctx.tenantId)),
      db
        .select({ n: count() })
        .from(products)
        .where(
          and(
            eq(products.tenantId, ctx.tenantId),
            isNull(products.archivedAt),
            sql`${products.lowStockThreshold} is not null and ${products.stockQty} <= ${products.lowStockThreshold}`,
          ),
        ),
    ]);

  const countsByStatus: Record<string, number> = {};
  for (const r of statusRows) {
    // fold legacy statuses into their current equivalent
    const key =
      r.status === "delivered"
        ? "completed"
        : ["draft", "packed", "shipped"].includes(r.status)
          ? "confirmed"
          : r.status;
    countsByStatus[key] = (countsByStatus[key] ?? 0) + Number(r.n);
  }

  return {
    needsAction: Number(needsAgg[0]?.n ?? 0),
    openOrders: Number(openAgg[0]?.n ?? 0),
    openValue: Number(openAgg[0]?.value ?? 0).toFixed(2),
    completedCount: Number(doneAgg[0]?.n ?? 0),
    completedValue: Number(doneAgg[0]?.value ?? 0).toFixed(2),
    outstandingValue: Number(outstandingAgg[0]?.value ?? 0).toFixed(2),
    customerCount: Number(customerAgg[0]?.n ?? 0),
    lowStockCount: Number(lowStockAgg[0]?.n ?? 0),
    pendingReview: Number(countsByStatus.pending ?? 0),
    countsByStatus,
  };
}
