import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";
import { signOutAction } from "@/app/actions/session";
import { upsellState } from "@/lib/upsell";
import { DesktopSidebar, MobileNav, Breadcrumbs } from "@/components/desk/nav";
import { UpsellBanner } from "@/components/desk/upsell-banner";

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActive();
  const [tenant, upsell] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    upsellState(ctx),
  ]);
  const trial = tenant?.trialEndsAt
    ? `Trial ends ${new Date(tenant.trialEndsAt).toLocaleDateString()}`
    : null;

  return (
    <div className="flex min-h-full flex-1">
      <DesktopSidebar appName={APP_NAME} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <MobileNav appName={APP_NAME} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{tenant?.name ?? "Order Desk"}</p>
            <Breadcrumbs />
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
              {ctx.role}
            </p>
            {trial && <p className="text-[10px] text-muted">{trial}</p>}
          </div>
          <form action={signOutAction}>
            <button className="rounded-lg border border-line px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </header>

        {upsell.show && <UpsellBanner reason={upsell.reason} />}

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          {children}
        </main>

        {/* eslint-disable @next/next/no-html-link-for-pages -- CSV download endpoints, not pages */}
        <footer className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-4 gap-y-1 px-4 pb-8 pt-2 text-xs text-muted sm:px-6">
          <span>Export CSV:</span>
          <a href="/desk/export/orders" className="underline underline-offset-2 hover:text-ink">Orders</a>
          <a href="/desk/export/customers" className="underline underline-offset-2 hover:text-ink">Customers</a>
          <a href="/desk/export/products" className="underline underline-offset-2 hover:text-ink">Products</a>
        </footer>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </div>
    </div>
  );
}
