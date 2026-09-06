import "server-only";
import { and, eq, inArray, sql, count, isNull } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

export type DashboardMetrics = {
  needsAction: number;
  openOrders: number;
  openValue: string;
  deliveredCount: number;
  deliveredValue: string;
  draftCount: number;
  customerCount: number;
  lowStockCount: number;
  countsByStatus: Record<string, number>;
};

const OPEN: ("confirmed" | "packed" | "shipped")[] = ["confirmed", "packed", "shipped"];

export async function dashboardMetrics(ctx: ActiveContext): Promise<DashboardMetrics> {
  const [statusRows, openAgg, deliveredAgg, customerAgg, lowStockAgg] = await Promise.all([
    db
      .select({ status: orders.status, n: count(), value: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(eq(orders.tenantId, ctx.tenantId))
      .groupBy(orders.status),
    db
      .select({ value: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(eq(orders.tenantId, ctx.tenantId), inArray(orders.status, OPEN))),
    db
      .select({ value: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(eq(orders.tenantId, ctx.tenantId), eq(orders.status, "delivered"))),
    db
      .select({ n: count() })
      .from(customers)
      .where(eq(customers.tenantId, ctx.tenantId)),
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
  for (const r of statusRows) countsByStatus[r.status] = Number(r.n);

  const openOrders = OPEN.reduce((a, s) => a + (countsByStatus[s] ?? 0), 0);

  return {
    needsAction: (countsByStatus.confirmed ?? 0) + (countsByStatus.packed ?? 0),
    openOrders,
    openValue: Number(openAgg[0]?.value ?? 0).toFixed(2),
    deliveredCount: countsByStatus.delivered ?? 0,
    deliveredValue: Number(deliveredAgg[0]?.value ?? 0).toFixed(2),
    draftCount: countsByStatus.draft ?? 0,
    customerCount: Number(customerAgg[0]?.n ?? 0),
    lowStockCount: Number(lowStockAgg[0]?.n ?? 0),
    countsByStatus,
  };
}
