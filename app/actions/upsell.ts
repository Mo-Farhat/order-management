"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";

export async function dismissUpsell(): Promise<void> {
  const ctx = await requireActive();
  await db
    .update(tenants)
    .set({ upsellDismissedAt: new Date() })
    .where(eq(tenants.id, ctx.tenantId));
  revalidatePath("/desk", "layout");
}
