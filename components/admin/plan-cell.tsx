"use client";

import { useFormStatus } from "react-dom";
import { setTenantPlan } from "@/app/actions/admin";
import { PLAN_OPTIONS } from "@/lib/plans";
import { TIER_OPTIONS } from "@/lib/entitlements";
import { Spinner } from "@/components/desk/ui";
import type { PlanStatus, PlanTier } from "@/db/schema";

const TONE: Record<PlanStatus, string> = {
  trialing: "text-warn",
  active: "text-accent",
  past_due: "text-danger",
  read_only: "text-danger",
  cancelled: "text-muted",
};

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString() : "—";
}

function daysLeft(s: string | null): number | null {
  if (!s) return null;
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000);
}

function Controls({
  planStatus,
  planTier,
  proWebsiteDiscount,
  trialEndsAt,
}: {
  planStatus: PlanStatus;
  planTier: PlanTier;
  proWebsiteDiscount: boolean;
  trialEndsAt: string | null;
}) {
  const { pending } = useFormStatus();
  const left = daysLeft(trialEndsAt);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {pending && <Spinner className="text-muted" />}
        <select
          name="planStatus"
          defaultValue={planStatus}
          disabled={pending}
          aria-label="Subscription status"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={`w-[7rem] rounded-md border border-line bg-card px-1.5 py-1 font-mono text-[10px] uppercase tracking-wide outline-none focus:border-accent disabled:opacity-50 ${TONE[planStatus]}`}
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>

        <select
          name="planTier"
          defaultValue={planTier}
          disabled={pending}
          aria-label="Plan tier"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-[5.5rem] rounded-md border border-line bg-card px-1.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink outline-none focus:border-accent disabled:opacity-50"
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {planTier === "pro" && (
        <label className="flex items-center gap-1.5 text-[10px] text-muted">
          website discount
          <select
            name="proWebsiteDiscount"
            defaultValue={proWebsiteDiscount ? "true" : "false"}
            disabled={pending}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded border border-line bg-card px-1 py-0.5 text-[10px] text-ink outline-none focus:border-accent disabled:opacity-50"
          >
            <option value="false">off</option>
            <option value="true">on</option>
          </select>
        </label>
      )}

      {planStatus === "trialing" && (
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className={left !== null && left <= 3 ? "text-danger" : ""}>
            {left === null
              ? "no end date"
              : left < 0
                ? `ended ${fmtDate(trialEndsAt)}`
                : `${left}d left`}
          </span>
          <button
            type="submit"
            name="extendDays"
            value="14"
            disabled={pending}
            title="Extend the trial by 14 days"
            className="rounded border border-line px-1 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            +14d
          </button>
        </span>
      )}
    </div>
  );
}

export function PlanCell({
  tenantId,
  planStatus,
  planTier,
  proWebsiteDiscount,
  trialEndsAt,
}: {
  tenantId: string;
  planStatus: PlanStatus;
  planTier: PlanTier;
  proWebsiteDiscount: boolean;
  trialEndsAt: string | null;
}) {
  return (
    <form action={setTenantPlan}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <Controls
        planStatus={planStatus}
        planTier={planTier}
        proWebsiteDiscount={proWebsiteDiscount}
        trialEndsAt={trialEndsAt}
      />
    </form>
  );
}
