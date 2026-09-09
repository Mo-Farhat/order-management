"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ZodError } from "zod";

import { db } from "@/db";
import { auditLog, tenants } from "@/db/schema";
import { requireCapability } from "@/lib/session";
import {
  shareHandoffSchema,
  shareSettingsSchema,
  storefrontConfigSchema,
  type StorefrontConfig,
} from "@/lib/validation";
import { pickAllowedConfig, tierAllows } from "@/lib/entitlements";
import { createShareHandoff, type HandoffResult } from "@/lib/share";
import { deleteObject, isStorageConfigured, uploadTenantImage } from "@/lib/storage";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type ShareState =
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

export async function saveShareSettings(
  _prev: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const ctx = await requireCapability("catalog:edit");

  const before = await db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) });
  if (!before) return { error: "Shop not found." };
  const tier = before.planTier;

  const rawCats = String(formData.get("storefrontCategories") ?? "");
  let categories: string[] = [];
  try {
    const arr = JSON.parse(rawCats);
    if (Array.isArray(arr)) categories = arr.map(String);
  } catch {
    categories = rawCats.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const parsed = shareSettingsSchema.safeParse({
    accentColor: formData.get("accentColor") ?? "",
    sharePolicyText: formData.get("sharePolicyText") ?? "",
    whatsappNumber: formData.get("whatsappNumber") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    storefrontCategories: categories,
    paused: formData.get("paused") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // Presentation config — a single hidden JSON field, then entitlement-filtered
  // so a locked field can never be written even if the form is tampered with.
  let config: StorefrontConfig = {};
  const rawConfig = formData.get("storefrontConfig");
  if (typeof rawConfig === "string" && rawConfig.trim()) {
    try {
      const c = storefrontConfigSchema.safeParse(JSON.parse(rawConfig));
      if (c.success) config = pickAllowedConfig(c.data, tier);
    } catch {
      /* ignore malformed config — keep {} */
    }
  }

  // --- Image uploads (logo always; banner only for tiers that allow it) ---
  let logoKey = before.logoKey;
  let bannerKey = before.bannerKey;
  if (isStorageConfigured()) {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0) {
      const { key } = await uploadTenantImage("logo", ctx.tenantId, logo);
      if (before.logoKey) await deleteObject(before.logoKey);
      logoKey = key;
    } else if (formData.get("removeLogo") === "on" && before.logoKey) {
      await deleteObject(before.logoKey);
      logoKey = null;
    }

    if (tierAllows(tier, "bannerImage")) {
      const banner = formData.get("banner");
      if (banner instanceof File && banner.size > 0) {
        const { key } = await uploadTenantImage("banner", ctx.tenantId, banner);
        if (before.bannerKey) await deleteObject(before.bannerKey);
        bannerKey = key;
      } else if (formData.get("removeBanner") === "on" && before.bannerKey) {
        await deleteObject(before.bannerKey);
        bannerKey = null;
      }
    }
  }

  const patch = {
    accentColor: parsed.data.accentColor || null,
    sharePolicyText: parsed.data.sharePolicyText || null,
    whatsappNumber: parsed.data.whatsappNumber?.trim() || null,
    instagramHandle: parsed.data.instagramHandle || null,
    storefrontCategories: parsed.data.storefrontCategories,
    publicPagePaused: parsed.data.paused,
    storefrontConfig: config,
    logoKey,
    bannerKey,
    updatedAt: new Date(),
  };

  const beforeSnapshot = {
    accentColor: before.accentColor,
    sharePolicyText: before.sharePolicyText,
    whatsappNumber: before.whatsappNumber,
    instagramHandle: before.instagramHandle,
    storefrontCategories: before.storefrontCategories,
    publicPagePaused: before.publicPagePaused,
    storefrontConfig: before.storefrontConfig ?? {},
    logoKey: before.logoKey,
    bannerKey: before.bannerKey,
  };
  const afterSnapshot = { ...beforeSnapshot, ...patch };
  delete (afterSnapshot as { updatedAt?: Date }).updatedAt;
  const changed = JSON.stringify(beforeSnapshot) !== JSON.stringify(afterSnapshot);

  if (!changed) return { ok: "No changes." };

  await db.update(tenants).set(patch).where(eq(tenants.id, ctx.tenantId));

  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "storefront.settings_updated",
    entity: "tenant",
    entityId: ctx.tenantId,
    before: beforeSnapshot,
    after: afterSnapshot,
  });

  revalidatePath("/desk/share");
  revalidatePath(`/s/${before.slug}`, "layout");
  return { ok: "Saved." };
}

/**
 * Public — called from the storefront page by an unauthenticated visitor.
 * Freezes their selection and returns a WhatsApp deep-link body + reference code.
 */
export async function startShareHandoff(
  input: unknown,
): Promise<{ ok: true; result: HandoffResult } | { ok: false; error: string }> {
  const limit = await rateLimit(`handoff:${await clientIp()}`, 12, 10 * 60);
  if (!limit.ok) {
    return { ok: false, error: "You've sent a lot of orders in a short time — try again shortly." };
  }

  const parsed = shareHandoffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your selection." };
  }
  try {
    const result = await createShareHandoff(parsed.data);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't build that order." };
  }
}
