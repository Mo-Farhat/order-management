import "server-only";
import { and, eq, count, isNull } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, tenants } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

export type OnboardingStep = {
  key: string;
  title: string;
  done: boolean;
  href: string;
};

export type OnboardingStatus = {
  dismissed: boolean;
  complete: boolean;
  steps: OnboardingStep[];
};

/**
 * First-run "Get started" checklist shown on the dashboard until every step is
 * done or the owner dismisses it (`tenants.onboardingDismissedAt`).
 */
export async function gettingStartedStatus(ctx: ActiveContext): Promise<OnboardingStatus> {
  const [tenant, productAgg, orderAgg] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    db
      .select({ n: count() })
      .from(products)
      .where(and(eq(products.tenantId, ctx.tenantId), isNull(products.archivedAt))),
    db.select({ n: count() }).from(orders).where(eq(orders.tenantId, ctx.tenantId)),
  ]);

  const hasProducts = Number(productAgg[0]?.n ?? 0) > 0;
  const hasContact = Boolean(tenant?.whatsappNumber || tenant?.instagramHandle);
  const hasOrders = Number(orderAgg[0]?.n ?? 0) > 0;

  const steps: OnboardingStep[] = [
    {
      key: "product",
      title: "Add your first product",
      done: hasProducts,
      href: "/desk/catalog",
    },
    {
      key: "contact",
      title: "Add a WhatsApp number or Instagram handle",
      done: hasContact,
      href: "/desk/share",
    },
    {
      key: "order",
      title: "Take your first order",
      done: hasOrders,
      href: "/desk/orders/new",
    },
  ];

  return {
    dismissed: Boolean(tenant?.onboardingDismissedAt),
    complete: steps.every((s) => s.done),
    steps,
  };
}
