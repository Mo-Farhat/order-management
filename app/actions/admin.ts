"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { db } from "@/db";
import { auditLog, tenants } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/session";
import { PLAN_VALUES } from "@/lib/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

const setPlanSchema = z.object({
  tenantId: z.uuid(),
  planStatus: z.enum(PLAN_VALUES),
  /** Present only when the operator clicked "extend trial". */
  extendDays: z.coerce.number().int().min(0).max(365).default(0),
});

/**
 * Platform-operator override of a shop's subscription state — the manual
 * stand-in until billing is wired. Whatever provider we integrate later writes
 * the same `planStatus` field, so this stays useful as the override path.
 *
 * Every change is written to the audit log with the operator as the actor.
 */
export async function setTenantPlan(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();

  const parsed = setPlanSchema.safeParse({
    tenantId: formData.get("tenantId"),
    planStatus: formData.get("planStatus"),
    extendDays: formData.get("extendDays") ?? 0,
  });
  if (!parsed.success) {
    // Admin-only surface with a fixed set of inputs — bad data means tampering
    // or a bug, not something to render a friendly message for.
    throw new Error(`setTenantPlan: invalid input — ${parsed.error.issues[0]?.message}`);
  }
  const { tenantId, planStatus, extendDays } = parsed.data;

  const before = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { name: true, planStatus: true, trialEndsAt: true },
  });
  if (!before) throw new Error("setTenantPlan: no such shop");

  const patch: { planStatus: typeof planStatus; updatedAt: Date; trialEndsAt?: Date } = {
    planStatus,
    updatedAt: new Date(),
  };

  if (extendDays > 0) {
    // Extend from the existing end date if it's still in the future, otherwise
    // from today — so extending a lapsed trial gives a full new window.
    const now = new Date();
    const base =
      before.trialEndsAt && before.trialEndsAt.getTime() > now.getTime()
        ? before.trialEndsAt
        : now;
    patch.trialEndsAt = new Date(base.getTime() + extendDays * DAY_MS);
  }

  const noChange = before.planStatus === planStatus && extendDays === 0;
  if (noChange) return;

  await db.update(tenants).set(patch).where(eq(tenants.id, tenantId));

  await db.insert(auditLog).values({
    tenantId,
    actorUserId: admin.userId,
    action: "tenant.plan_changed",
    entity: "tenant",
    entityId: tenantId,
    before: {
      planStatus: before.planStatus,
      trialEndsAt: before.trialEndsAt?.toISOString() ?? null,
    },
    after: {
      planStatus,
      trialEndsAt:
        (patch.trialEndsAt ?? before.trialEndsAt)?.toISOString() ?? null,
      by: admin.email,
    },
  });

  revalidatePath("/admin");
}
