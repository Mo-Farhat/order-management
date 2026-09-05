import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";
import { signOutAction } from "@/app/actions/session";
import { DeskTabs } from "@/components/desk-tabs";

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireActive();
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex items-start justify-between px-5 pt-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
            {APP_NAME}
          </p>
          <h1 className="mt-0.5 text-lg font-medium tracking-tight">
            {tenant?.name ?? "Order Desk"}
          </h1>
          <p className="text-xs text-muted">
            desk/{tenant?.slug} · {ctx.role}
            {tenant?.trialEndsAt
              ? ` · trial ends ${new Date(tenant.trialEndsAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <form action={signOutAction}>
          <button className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>

      <DeskTabs />

      <main className="flex flex-1 flex-col px-5 py-6">{children}</main>

      {/* eslint-disable @next/next/no-html-link-for-pages -- these are CSV download endpoints, not pages */}
      <footer className="flex flex-wrap gap-x-4 gap-y-1 px-5 pb-6 pt-2 text-xs text-muted">
        <span>Export CSV:</span>
        <a href="/desk/export/orders" className="underline underline-offset-2">Orders</a>
        <a href="/desk/export/customers" className="underline underline-offset-2">Customers</a>
        <a href="/desk/export/products" className="underline underline-offset-2">Products</a>
      </footer>
      {/* eslint-enable @next/next/no-html-link-for-pages */}
    </div>
  );
}
