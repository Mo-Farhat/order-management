import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { can } from "@/lib/rbac";
import { tierAllows } from "@/lib/entitlements";
import { listApiKeys } from "@/lib/api-keys";
import { PageHeader, Card } from "@/components/desk/ui";
import { BusinessSettingsForm, ChangePasswordForm } from "@/components/settings/settings-forms";
import { ApiKeys } from "@/components/settings/api-keys";

export default async function SettingsPage() {
  const ctx = await requireActive();
  const showApi = can(ctx.role, "billing");
  const [tenant, user, keys] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    db.query.users.findFirst({ where: eq(users.id, ctx.userId), columns: { hashedPassword: true } }),
    showApi ? listApiKeys(ctx) : Promise.resolve([]),
  ]);

  const tier = tenant?.planTier ?? "basic";
  const showApiCard = showApi && (tierAllows(tier, "readApi") || keys.length > 0);

  return (
    <>
      <PageHeader title="Settings" subtitle={ctx.email} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Business">
          <BusinessSettingsForm
            name={tenant?.name ?? ""}
            slug={tenant?.slug ?? ctx.tenantSlug}
            currency={tenant?.currency ?? "LKR"}
            deliveryFeeDefault={tenant?.deliveryFeeDefault ?? ""}
            stockTrackingEnabled={tenant?.stockTrackingEnabled ?? true}
          />
        </Card>

        <Card title="Security">
          <ChangePasswordForm hasPassword={Boolean(user?.hashedPassword)} />
        </Card>
      </div>

      {showApiCard && (
        <Card title="API access" icon="🔑">
          {!tierAllows(tier, "readApi") && (
            <p className="mb-2 text-xs text-muted">
              The read API is a Pro feature. Existing keys keep working; new keys need Pro.
            </p>
          )}
          <ApiKeys keys={keys} />
        </Card>
      )}

      <p className="text-xs text-muted">
        Plan: {tenant?.planStatus ?? "trialing"} · {tier} tier
        {tenant?.trialEndsAt ? ` · trial ends ${new Date(tenant.trialEndsAt).toLocaleDateString()}` : ""}
        {" "}· billing arrives in a later update.
      </p>
    </>
  );
}
