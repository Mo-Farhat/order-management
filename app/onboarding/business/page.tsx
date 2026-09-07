import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { memberships, tenants } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { BusinessBasicsForm } from "./form";

export const metadata = { title: "Set up your business" };

/**
 * Fallback for accounts that exist without a workspace — accounts created by
 * the old two-step flow, or a signup whose tenant creation failed. The normal
 * path now creates everything at /signup, so most users never see this.
 */
export default async function BusinessBasicsPage() {
  const { userId, email } = await requireUser();

  // proxy.ts no longer routes on tenantId (it can't see a fresh one), so this
  // page owns the "already set up?" check itself. It must agree with
  // `loadMembership` in auth.ts — which also requires the tenant row to exist —
  // or the two would bounce the user back and forth forever.
  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
    columns: { tenantId: true },
  });
  const tenant = existing
    ? await db.query.tenants.findFirst({
        where: eq(tenants.id, existing.tenantId),
        columns: { id: true },
      })
    : null;
  if (tenant) redirect("/desk");

  return <BusinessBasicsForm email={email} />;
}
