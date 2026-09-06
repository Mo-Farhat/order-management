import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { PageHeader, Card } from "@/components/desk/ui";
import { BusinessSettingsForm, ChangePasswordForm } from "@/components/settings/settings-forms";

export default async function SettingsPage() {
  const ctx = await requireActive();
  const [tenant, user] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    db.query.users.findFirst({ where: eq(users.id, ctx.userId), columns: { hashedPassword: true } }),
  ]);

  return (
    <>
      <PageHeader title="Settings" subtitle={ctx.email} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Business">
          <BusinessSettingsForm
            name={tenant?.name ?? ""}
            whatsappNumber={tenant?.whatsappNumber ?? ""}
            currency={tenant?.currency ?? "LKR"}
            deliveryFeeDefault={tenant?.deliveryFeeDefault ?? ""}
            stockTrackingEnabled={tenant?.stockTrackingEnabled ?? true}
          />
        </Card>

        <Card title="Security">
          <ChangePasswordForm hasPassword={Boolean(user?.hashedPassword)} />
        </Card>
      </div>

      <p className="text-xs text-muted">
        Plan: {tenant?.planStatus ?? "trialing"}
        {tenant?.trialEndsAt ? ` · trial ends ${new Date(tenant.trialEndsAt).toLocaleDateString()}` : ""}
        {" "}· billing arrives in a later update.
      </p>
    </>
  );
}
