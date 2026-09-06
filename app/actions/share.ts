"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ZodError } from "zod";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireCapability } from "@/lib/session";
import { shareHandoffSchema, shareSettingsSchema } from "@/lib/validation";
import { createShareHandoff, type HandoffResult } from "@/lib/share";

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
  const parsed = shareSettingsSchema.safeParse({
    accentColor: formData.get("accentColor") ?? "",
    sharePolicyText: formData.get("sharePolicyText") ?? "",
    paused: formData.get("paused") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  await db
    .update(tenants)
    .set({
      accentColor: parsed.data.accentColor || null,
      sharePolicyText: parsed.data.sharePolicyText || null,
      publicPagePaused: parsed.data.paused,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, ctx.tenantId));

  revalidatePath("/desk/share");
  return { ok: "Saved." };
}

/**
 * Public — called from the storefront page by an unauthenticated visitor.
 * Freezes their selection and returns a WhatsApp deep-link body + reference code.
 */
export async function startShareHandoff(
  input: unknown,
): Promise<{ ok: true; result: HandoffResult } | { ok: false; error: string }> {
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
