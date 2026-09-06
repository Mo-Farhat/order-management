"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/session";
import { createApiKey, revokeApiKey } from "@/lib/api-keys";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export type ApiKeyState =
  | { error?: string; ok?: string; plaintext?: string }
  | undefined;

export async function createApiKeyAction(
  _prev: ApiKeyState,
  formData: FormData,
): Promise<ApiKeyState> {
  const ctx = await requireCapability("billing"); // owner-only, like other account settings
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) return { error: "Give the key a name so you can tell them apart." };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };

  const { plaintext, keyPrefix } = await createApiKey(ctx, name);
  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "api_key.created",
    entity: "api_key",
    after: { name, keyPrefix },
  });

  revalidatePath("/desk/settings");
  return { ok: "Key created. Copy it now — it won't be shown again.", plaintext };
}

export async function revokeApiKeyAction(id: string): Promise<ApiKeyState> {
  const ctx = await requireCapability("billing");
  await revokeApiKey(ctx, id);
  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "api_key.revoked",
    entity: "api_key",
    entityId: id,
  });
  revalidatePath("/desk/settings");
  return { ok: "Key revoked." };
}
