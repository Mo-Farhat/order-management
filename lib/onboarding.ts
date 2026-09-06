import "server-only";
import { and, eq, count, isNull } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, tenants } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

export type OnboardingStep = {
  key: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  done: boolean;
};

export type OnboardingStatus = {
  dismissed: boolean;
  complete: boolean;
  storeUrl: string;
  steps: OnboardingStep[];
};

/**
 * First-run "Set up your shop" guide shown on the dashboard until every step is
 * done or the owner dismisses it (`tenants.onboardingDismissedAt`). The first
 * step that isn't done is the "active" one — the UI expands it and shows its CTA.
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
  const hasBranding = Boolean(tenant?.accentColor || tenant?.logoKey);
  const hasOrders = Number(orderAgg[0]?.n ?? 0) > 0;

  const steps: OnboardingStep[] = [
    {
      key: "product",
      title: "Add your products",
      blurb:
        "List what you sell — name, price, and a photo. Your products appear on your storefront and in the new-order screen.",
      cta: "Add a product",
      href: "/desk/catalog/new",
      done: hasProducts,
    },
    {
      key: "contact",
      title: "Connect WhatsApp or Instagram",
      blurb:
        "Add the account customers should send their orders to. You need at least one; add both to show both buttons.",
      cta: "Open storefront settings",
      href: "/desk/share",
      done: hasContact,
    },
    {
      key: "branding",
      title: "Make the storefront yours",
      blurb:
        "Set an accent colour and a logo, pick which categories show as filters, and add a delivery / payment note.",
      cta: "Customise storefront",
      href: "/desk/share",
      done: hasBranding,
    },
    {
      key: "order",
      title: "Take your first order",
      blurb:
        "Share your storefront link, or add an order by hand to see how the pipeline works.",
      cta: "Preview & share",
      href: "/desk/share",
      done: hasOrders,
    },
  ];

  return {
    dismissed: Boolean(tenant?.onboardingDismissedAt),
    complete: steps.every((s) => s.done),
    storeUrl: tenant?.slug ? `/s/${tenant.slug}` : "/desk/share",
    steps,
  };
}
