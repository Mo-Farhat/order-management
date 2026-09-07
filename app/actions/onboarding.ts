"use server";

import { eq } from "drizzle-orm";

import { updateSession } from "@/auth";
import { db } from "@/db";
import { pooledDb } from "@/db/tenant";
import { auditLog, memberships, tenants } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { businessBasicsSchema, slugify } from "@/lib/validation";
import { normalizePhone } from "@/lib/phone";
import type { FormState } from "@/app/actions/auth";

const TRIAL_DAYS = 14; // FR-19

/** Picks the first free slug: base, base-2, base-3, ... */
async function resolveSlug(base: string): Promise<string> {
  const candidate = slugify(base);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate}-${i + 1}`;
    const taken = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      columns: { id: true },
    });
    if (!taken) return slug;
  }
  return `${candidate}-${Date.now().toString(36)}`;
}

/**
 * Onboarding step S2 — create the tenant + owner membership.
 *
 * On success this returns `{ ok: "/desk" }` rather than calling `redirect()`.
 * The client then does a full navigation to `/desk`. That matters: the JWT
 * cookie rewritten by `updateSession()` needs to be sent back to the browser
 * *before* the next request hits `proxy.ts` (which gates `/desk` purely on the
 * token's `tenantId`). Redirecting from inside the action raced that write and
 * bounced the user straight back here.
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

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  let tenantId: string;
  try {
    const slug = await resolveSlug(parsed.data.name);
    // neon-http has no transaction support; use the pooled (WebSocket) client.
    tenantId = await pooledDb().transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ name: parsed.data.name, slug, whatsappNumber, trialEndsAt })
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
