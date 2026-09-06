"use client";

import { useTransition } from "react";
import { dismissUpsell } from "@/app/actions/upsell";

export function UpsellBanner({ reason }: { reason: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-accent/30 bg-accent-weak px-4 py-2 text-sm sm:px-6">
      <span className="font-medium">Ready for a real website?</span>
      <span className="text-muted">{reason} Your catalog and orders come with you — nothing to rebuild.</span>
      <a
        href="mailto:hello@example.com?subject=Website%20upgrade"
        className="font-semibold text-accent underline underline-offset-2"
      >
        Talk to us
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => dismissUpsell())}
        className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-widest text-muted hover:text-ink disabled:opacity-40"
      >
        Dismiss
      </button>
    </div>
  );
}
