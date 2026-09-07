"use server";

import { eq } from "drizzle-orm";

import { updateSession } from "@/auth";
import { db } from "@/db";
import { pooledDb } from "@/db/tenant";
import { auditLog, memberships, tenants } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { businessBasicsSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import { resolveSlug, trialEndsAt } from "@/lib/provisioning";
import type { FormState } from "@/app/actions/auth";

/**
 * Recovery path for an account with no workspace — the normal flow creates
 * everything at /signup. Returns `{ ok: "/desk" }` and lets the client do a
 * full navigation; the session refresh below is a best-effort optimisation
 * only, since `requireActive()` resolves the tenant from the database anyway.
 */
export async function saveBusinessBasics(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { userId } = await requireUser();

  // Idempotency: already onboarded (or a stuck/stale token). Refresh the token
  // and send them on — don't try to create a second tenant.
  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
    columns: { id: true, tenantId: true },
  });
  if (existing) {
    await safeRefreshSession(existing.tenantId);
    return { ok: "/desk" };
  }

  const parsed = businessBasicsSchema.safeParse({
    name: formData.get("name"),
    whatsappNumber: formData.get("whatsappNumber"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors };
  }

  const whatsappNumber = normalizePhone(parsed.data.whatsappNumber);
  if (!whatsappNumber || whatsappNumber.replace(/\D/g, "").length < 9) {
    return {
      fieldErrors: {
        whatsappNumber: [
          "That doesn't look like a valid mobile number. Enter it like 077 123 4567 or +94 77 123 4567.",
        ],
      },
    };
  }

  let tenantId: string;
  try {
    const slug = await resolveSlug(parsed.data.name);
    // neon-http has no transaction support; use the pooled (WebSocket) client.
    tenantId = await pooledDb().transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: parsed.data.name, slug, whatsappNumber, trialEndsAt: trialEndsAt() })
        .returning({ id: tenants.id });

      if (!tenant) throw new Error("tenant insert returned no row");

      await tx.insert(memberships).values({
        userId,
        tenantId: tenant.id,
        role: "owner",
      });

      await tx.insert(auditLog).values({
        tenantId: tenant.id,
        actorUserId: userId,
        action: "tenant.created",
        entity: "tenant",
        entityId: tenant.id,
        after: { name: parsed.data.name, slug },
      });

      return tenant.id;
    });
  } catch (err) {
    console.error("[onboarding] failed to create tenant", err);
    return {
      error:
        "Something went wrong setting up your workspace. Please try again — if it keeps happening, contact support.",
    };
  }

  await safeRefreshSession(tenantId);
  return { ok: "/desk" };
}

/**
 * Refresh the JWT so `tenantId` / `role` are on the token for the next request.
 * Non-fatal: if it throws, `app/onboarding/business/page.tsx` re-checks the DB
 * on load and heals the token there, so onboarding still completes.
 */
async function safeRefreshSession(tenantId: string): Promise<void> {
  try {
    await updateSession({ user: { tenantId } });
  } catch (err) {
    console.error("[onboarding] session refresh failed (will self-heal)", err);
  }
}
