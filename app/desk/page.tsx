import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";
import { signOutAction } from "@/app/actions/session";

const STEPS = [
  { label: "Add a product", done: false },
  { label: "Take an order", done: false },
  { label: "Share your link", done: false },
] as const;

export default async function DeskPage() {
  const ctx = await requireActive();
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, ctx.tenantId),
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
            {APP_NAME}
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight">
            {tenant?.name ?? "Order Desk"}
          </h1>
          <p className="text-xs text-muted">
            desk/{tenant?.slug} · {ctx.role} · trial ends{" "}
            {tenant?.trialEndsAt
              ? new Date(tenant.trialEndsAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <form action={signOutAction}>
          <button className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>

      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        {STEPS.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3 px-4 py-3">
            <span
              className="flex size-6 items-center justify-center rounded-full border border-line font-mono text-[11px]"
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="text-sm">{step.label}</span>
            {i === 0 && (
              <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                Next
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="text-sm text-muted">
        Phase 1 is in place: your account, business, and role are set up. Catalog
        and the order flow land in Phase 2–3.
      </p>
    </main>
  );
}
