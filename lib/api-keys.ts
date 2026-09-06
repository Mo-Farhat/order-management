import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import type { ActiveContext } from "@/lib/session";

const PREFIX = "sd_live_";

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Mints a new key. The plaintext is returned once and never stored. */
export async function createApiKey(
  ctx: ActiveContext,
  name: string,
): Promise<{ plaintext: string; keyPrefix: string }> {
  const plaintext = PREFIX + randomBytes(24).toString("hex");
  const keyPrefix = plaintext.slice(0, PREFIX.length + 8);

  await db.insert(apiKeys).values({
    tenantId: ctx.tenantId,
    name: name.trim() || "Untitled key",
    keyPrefix,
    hashedKey: hashKey(plaintext),
    createdBy: ctx.userId,
  });

  return { plaintext, keyPrefix };
}

export async function listApiKeys(ctx: ActiveContext) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.tenantId, ctx.tenantId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(ctx: ActiveContext, id: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, ctx.tenantId), isNull(apiKeys.revokedAt)));
}

/**
 * Resolves an `Authorization: Bearer <key>` header to a tenant id, or null.
 * Used only by the public /api/v1 endpoints. Touches `lastUsedAt` best-effort.
 */
export async function resolveApiKey(authorization: string | null): Promise<string | null> {
  if (!authorization) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  const plaintext = m?.[1];
  if (!plaintext || !plaintext.startsWith(PREFIX)) return null;

  const row = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.hashedKey, hashKey(plaintext)), isNull(apiKeys.revokedAt)),
    columns: { id: true, tenantId: true },
  });
  if (!row) return null;

  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {});

  return row.tenantId;
}
