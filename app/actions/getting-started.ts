"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";

export async function dismissOnboarding(): Promise<void> {
  const ctx = await requireActive();
  await db
    .update(tenants)
    .set({ onboardingDismissedAt: new Date(), updatedAt: new Date() })
    .where(eq(tenants.id, ctx.tenantId));
  revalidatePath("/desk");
}
