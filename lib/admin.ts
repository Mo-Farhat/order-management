import "server-only";
import { and, count, desc, gte, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders, products, tenants } from "@/db/schema";
import type { PlanStatus, PlanTier } from "@/db/schema";

/**
 * Platform-operator analytics — reads every tenant via the owner `db`
 * connection (bypasses RLS). Never call from a tenant-scoped path; only from
 * `/admin`, behind `requirePlatformAdmin()`.
 */

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

const num = (v: unknown) => Number(v ?? 0);

export type PlatformOverview = {
  shopCount: number;
  newShops7: number;
  newShops30: number;
  activeShops30: number;
  planBreakdown: Record<string, number>;
  tierBreakdown: Record<string, number>;
  orderCount: number;
  gmv: number;
  collected: number;
  outstanding: number;
  customerCount: number;
  productCount: number;
  currencies: string[];
};

export async function platformOverview(): Promise<PlatformOverview> {
  const notCancelled = ne(orders.status, "cancelled");

  const [
    [shops],
    [new7],
    [new30],
    [active30],
    plans,
    tiers,
    [orderAgg],
    [collectedAgg],
    [outstandingAgg],
    [custAgg],
    [prodAgg],
    currencyRows,
  ] = await Promise.all([
    db.select({ n: count() }).from(tenants),
    db.select({ n: count() }).from(tenants).where(gte(tenants.createdAt, daysAgo(7))),
    db.select({ n: count() }).from(tenants).where(gte(tenants.createdAt, daysAgo(30))),
    db
      .select({ n: sql<number>`count(distinct ${orders.tenantId})` })
      .from(orders)
      .where(gte(orders.createdAt, daysAgo(30))),
    db.select({ plan: tenants.planStatus, n: count() }).from(tenants).groupBy(tenants.planStatus),
    db.select({ tier: tenants.planTier, n: count() }).from(tenants).groupBy(tenants.planTier),
    db
      .select({
        n: count(),
        gmv: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(notCancelled),
    db
      .select({ v: sql<string>`coalesce(sum(${orders.amountPaid}), 0)` })
      .from(orders)
      .where(notCancelled),
    db
      .select({
        v: sql<string>`coalesce(sum(${orders.total}::numeric - ${orders.amountPaid}::numeric), 0)`,
      })
      .from(orders)
      .where(and(notCancelled, ne(orders.paymentStatus, "paid"))),
    db.select({ n: count() }).from(customers),
    db.select({ n: count() }).from(products).where(sql`${products.archivedAt} is null`),
    db.selectDistinct({ c: tenants.currency }).from(tenants),
  ]);

  const planBreakdown: Record<string, number> = {};
  for (const p of plans) planBreakdown[p.plan] = num(p.n);
  const tierBreakdown: Record<string, number> = {};
  for (const t of tiers) tierBreakdown[t.tier] = num(t.n);

  return {
    shopCount: num(shops?.n),
    newShops7: num(new7?.n),
    newShops30: num(new30?.n),
    activeShops30: num(active30?.n),
    planBreakdown,
    tierBreakdown,
    orderCount: num(orderAgg?.n),
    gmv: num(orderAgg?.gmv),
    collected: num(collectedAgg?.v),
    outstanding: num(outstandingAgg?.v),
    customerCount: num(custAgg?.n),
    productCount: num(prodAgg?.n),
    currencies: currencyRows.map((r) => r.c),
  };
}

export type ShopRow = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  planStatus: PlanStatus;
  planTier: PlanTier;
  proWebsiteDiscount: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  orders: number;
  gmv: number;
  lastOrderAt: string | null;
  customers: number;
  products: number;
  paused: boolean;
};

export async function shopsTable(rangeDays: number): Promise<ShopRow[]> {
  const since = rangeDays > 0 ? daysAgo(rangeDays) : new Date(0);

  const [rows, orderAgg, custAgg, prodAgg] = await Promise.all([
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db
      .select({
        tenantId: orders.tenantId,
        n: count(),
        gmv: sql<string>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)`,
        lastAt: sql<Date | null>`max(${orders.createdAt})`,
        nInRange: sql<number>`count(*) filter (where ${orders.createdAt} >= ${since.toISOString()})`,
        gmvInRange: sql<string>`coalesce(sum(case when ${orders.createdAt} >= ${since.toISOString()} and ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)`,
      })
      .from(orders)
      .groupBy(orders.tenantId),
    db.select({ tenantId: customers.tenantId, n: count() }).from(customers).groupBy(customers.tenantId),
    db
      .select({ tenantId: products.tenantId, n: count() })
      .from(products)
      .where(sql`${products.archivedAt} is null`)
      .groupBy(products.tenantId),
  ]);

  const oBy = new Map(orderAgg.map((r) => [r.tenantId, r]));
  const cBy = new Map(custAgg.map((r) => [r.tenantId, num(r.n)]));
  const pBy = new Map(prodAgg.map((r) => [r.tenantId, num(r.n)]));

  return rows.map((t) => {
    const o = oBy.get(t.id);
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      currency: t.currency,
      planStatus: t.planStatus,
      planTier: t.planTier,
      proWebsiteDiscount: t.proWebsiteDiscount,
      trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      orders: rangeDays > 0 ? num(o?.nInRange) : num(o?.n),
      gmv: rangeDays > 0 ? num(o?.gmvInRange) : num(o?.gmv),
      lastOrderAt: o?.lastAt ? new Date(o.lastAt).toISOString() : null,
      customers: cBy.get(t.id) ?? 0,
      products: pBy.get(t.id) ?? 0,
      paused: t.publicPagePaused,
    };
  });
}

export type TrendPoint = { date: string; shops: number; orders: number; gmv: number };

export async function platformTrend(rangeDays: number): Promise<TrendPoint[]> {
  const days = rangeDays > 0 ? rangeDays : 180;
  const since = daysAgo(days);

  const [shopRows, orderRows] = await Promise.all([
    db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${tenants.createdAt}), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(tenants)
      .where(gte(tenants.createdAt, since))
      .groupBy(sql`date_trunc('day', ${tenants.createdAt})`),
    db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        n: count(),
        gmv: sql<string>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, since))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`),
  ]);

  const shopsBy = new Map(shopRows.map((r) => [r.d, num(r.n)]));
  const ordersBy = new Map(orderRows.map((r) => [r.d, { n: num(r.n), gmv: num(r.gmv) }]));

  const out: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    const o = ordersBy.get(key);
    out.push({ date: key, shops: shopsBy.get(key) ?? 0, orders: o?.n ?? 0, gmv: o?.gmv ?? 0 });
  }
  return out;
}
