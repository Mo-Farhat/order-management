import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/db/schema";
import { assertCan, type Capability } from "@/lib/rbac";

export type ActiveContext = {
  userId: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  role: Role;
};

/** Signed-in user, no tenant required (used by the onboarding step). */
export async function requireUser(): Promise<{ userId: string; email: string; tenantId: string | null }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    tenantId: session.user.tenantId,
  };
}

/** Signed-in user with a tenant. Redirects to onboarding if there isn't one. */
export async function requireActive(): Promise<ActiveContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.tenantId || !session.user.role || !session.user.tenantSlug) {
    redirect("/onboarding/business");
  }
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    tenantId: session.user.tenantId,
    tenantSlug: session.user.tenantSlug,
    role: session.user.role,
  };
}

/** As `requireActive`, but also enforces a capability. Throws `ForbiddenError`. */
export async function requireCapability(capability: Capability): Promise<ActiveContext> {
  const ctx = await requireActive();
  assertCan(ctx.role, capability);
  return ctx;
}
