"use client";

import { useActionState, useState } from "react";
import { saveShareSettings } from "@/app/actions/share";
import { FormError } from "@/components/form";
import { Btn } from "@/components/desk/ui";

export function ShareSettingsForm({
  accentColor,
  sharePolicyText,
  paused,
}: {
  accentColor: string | null;
  sharePolicyText: string | null;
  paused: boolean;
}) {
  const [state, action] = useActionState(saveShareSettings, undefined);
  const [color, setColor] = useState(accentColor || "#0f7b6c");

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      {state?.ok && <p className="text-xs text-accent">{state.ok}</p>}

      <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3">
        <span className="text-sm">
          <span className="font-medium">Page is live</span>
          <span className="block text-xs text-muted">
            Turn off to show visitors a &ldquo;not taking orders&rdquo; message.
          </span>
        </span>
        <input
          type="checkbox"
          name="paused"
          defaultChecked={paused}
          className="size-5 accent-[var(--color-danger)]"
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">paused</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Accent colour
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 rounded-lg border border-line bg-surface"
          />
          <input
            name="accentColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-32 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
          />
        </div>
        {state?.fieldErrors?.accentColor?.map((m) => (
          <span key={m} className="text-xs text-danger">{m}</span>
        ))}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Delivery / policy note
        </span>
        <textarea
          name="sharePolicyText"
          defaultValue={sharePolicyText ?? ""}
          rows={3}
          maxLength={500}
          placeholder="e.g. Colombo delivery within 2 days. Cash or bank transfer."
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <Btn type="submit" className="self-start">Save settings</Btn>
    </form>
  );
}
