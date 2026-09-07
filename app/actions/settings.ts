"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ZodError } from "zod";

import { and, ne } from "drizzle-orm";

import { updateSession } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { db } from "@/db";
import { auditLog, tenants, users } from "@/db/schema";
import { requireActive, requireCapability } from "@/lib/session";
import { businessSettingsSchema, changePasswordSchema } from "@/lib/validation";

export type SettingsState =
  | { error?: string; fieldErrors?: Record<string, string[]>; ok?: string }
  | undefined;

function fieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export async function saveBusinessSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ctx = await requireCapability("catalog:edit");
  const parsed = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    currency: formData.get("currency"),
    deliveryFeeDefault: formData.get("deliveryFeeDefault") ?? "",
    stockTrackingEnabled: formData.get("stockTrackingEnabled") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const before = await db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) });

  const slugChanged = parsed.data.slug !== before?.slug;
  if (slugChanged) {
    const taken = await db.query.tenants.findFirst({
      where: and(eq(tenants.slug, parsed.data.slug), ne(tenants.id, ctx.tenantId)),
      columns: { id: true },
    });
    if (taken) {
      return { fieldErrors: { slug: ["That storefront address is already taken."] } };
    }
  }

  await db
    .update(tenants)
    .set({
      name: parsed.data.name,
      slug: parsed.data.slug,
      currency: parsed.data.currency,
      deliveryFeeDefault: parsed.data.deliveryFeeDefault || null,
      stockTrackingEnabled: parsed.data.stockTrackingEnabled,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, ctx.tenantId));

  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "tenant.settings_updated",
    entity: "tenant",
    entityId: ctx.tenantId,
    before: before ? { name: before.name, slug: before.slug, currency: before.currency } : null,
    after: { name: parsed.data.name, slug: parsed.data.slug, currency: parsed.data.currency },
  });

  if (slugChanged) {
    // `tenantSlug` is snapshotted in the JWT; refresh so the desk's "your link"
    // shows the new address. Best-effort — the share page also reads it from the
    // tenant row directly.
    try {
      await updateSession({});
    } catch {
      /* self-heals on next sign-in */
    }
  }

  revalidatePath("/desk");
  return { ok: slugChanged ? "Saved. Your storefront link changed — update it wherever you've shared it." : "Settings saved." };
}

export async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const ctx = await requireActive();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const user = await db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
  if (!user?.hashedPassword) {
    return { error: "This account signs in with a magic link — there's no password to change." };
  }
  const ok = await verifyPassword(parsed.data.currentPassword, user.hashedPassword);
  if (!ok) return { fieldErrors: { currentPassword: ["That's not your current password."] } };

  const hashedPassword = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ hashedPassword, passwordChangedAt: new Date() })
    .where(eq(users.id, ctx.userId));

  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "user.password_changed",
    entity: "user",
    entityId: ctx.userId,
  });

  // Re-snapshot this session's token so the caller stays signed in; every other
  // session's token now predates passwordChangedAt and is rejected (FR-2).
  await updateSession({});

  return { ok: "Password changed. Other devices have been signed out." };
}
