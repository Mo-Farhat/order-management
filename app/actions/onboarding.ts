"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { updateSession } from "@/auth";
import { db } from "@/db";
import { pooledDb } from "@/db/tenant";
import { auditLog, memberships, tenants } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { businessBasicsSchema, slugify } from "@/lib/validation";
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

export async function saveBusinessBasics(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { userId } = await requireUser();

  // Idempotency: if they already have a tenant, just move on.
  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, userId),
    columns: { id: true },
  });
  if (existing) redirect("/desk");

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

  const slug = await resolveSlug(parsed.data.name);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // neon-http has no transaction support; use the pooled (WebSocket) client.
  const tenantId = await pooledDb().transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({
        name: parsed.data.name,
        slug,
        whatsappNumber: parsed.data.whatsappNumber,
        trialEndsAt,
      })
      .returning({ id: tenants.id });

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

  // Refresh the JWT so `tenantId` / `role` are present on the next request.
  await updateSession({ user: { tenantId } });

  redirect("/desk");
}
