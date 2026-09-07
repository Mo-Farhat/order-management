"use client";

import { useFormStatus } from "react-dom";
import { setTenantPlan } from "@/app/actions/admin";
import { PLAN_OPTIONS } from "@/lib/plans";
import type { PlanStatus } from "@/db/schema";

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

/** Select + extend button. Disabled together while the action is in flight. */
function Controls({
  planStatus,
  trialEndsAt,
}: {
  planStatus: PlanStatus;
  trialEndsAt: string | null;
}) {
  const { pending } = useFormStatus();
  const left = daysLeft(trialEndsAt);

  return (
    <div className="flex flex-col gap-1">
      <select
        name="planStatus"
        defaultValue={planStatus}
        disabled={pending}
        aria-label="Subscription status"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`w-[7.5rem] rounded-md border border-line bg-card px-1.5 py-1 font-mono text-[10px] uppercase tracking-wide outline-none focus:border-accent disabled:opacity-50 ${TONE[planStatus]}`}
      >
        {PLAN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>

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
  trialEndsAt,
}: {
  tenantId: string;
  planStatus: PlanStatus;
  trialEndsAt: string | null;
}) {
  return (
    <form action={setTenantPlan}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <Controls planStatus={planStatus} trialEndsAt={trialEndsAt} />
    </form>
  );
}
