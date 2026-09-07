import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { slugify } from "@/lib/validation";

/** FR-19: every new tenant starts on a 14-day trial. */
export const TRIAL_DAYS = 14;

export function trialEndsAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Picks the first free storefront slug: base, base-2, base-3, …
 * Shared by signup and the standalone onboarding step.
 */
export async function resolveSlug(base: string): Promise<string> {
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
