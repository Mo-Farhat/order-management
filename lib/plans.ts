import type { PlanStatus } from "@/db/schema";

/**
 * The subscription states an operator can put a shop in, with display labels.
 *
 * Typed as `PlanStatus` so it fails typecheck if it drifts from the
 * `plan_status` Postgres enum. Kept in its own module (type-only import, no
 * runtime deps) so client components can use it without pulling Drizzle into
 * the browser bundle.
 */
export const PLAN_OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: "trialing", label: "Trialing" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "read_only", label: "Read only" },
  { value: "cancelled", label: "Cancelled" },
];

export const PLAN_VALUES = PLAN_OPTIONS.map((p) => p.value) as [
  PlanStatus,
  ...PlanStatus[],
];
