"use client";

import { useActionState } from "react";
import { saveIndustry } from "@/app/actions/settings";
import { INDUSTRIES, INDUSTRY_LABEL } from "@/lib/industries";
import { SubmitBtn } from "@/components/desk/submit-btn";

/** One-question prompt for shops created before signup asked "What do you sell?". */
export function IndustryPrompt() {
  const [state, action] = useActionState(saveIndustry, undefined);
  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent-weak/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-sm">
        <p className="font-semibold">What do you sell?</p>
        <p className="text-xs text-muted">
          We&apos;ll set up sizes, flavours and the like for your new products.
        </p>
      </div>
      <div className="flex gap-2">
        <select
          name="industry"
          defaultValue=""
          required
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-sm outline-none focus:border-accent sm:w-56"
        >
          <option value="" disabled>
            Pick one
          </option>
          {INDUSTRIES.map((v) => (
            <option key={v} value={v}>
              {INDUSTRY_LABEL[v]}
            </option>
          ))}
        </select>
        <SubmitBtn>Save</SubmitBtn>
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
