"use client";

import Link from "next/link";
import { useTransition } from "react";
import { dismissOnboarding } from "@/app/actions/getting-started";
import type { OnboardingStep } from "@/lib/onboarding";

export function DismissOnboarding() {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await dismissOnboarding(); })}
      disabled={pending}
      className="shrink-0 text-xs text-muted hover:underline disabled:opacity-50"
    >
      Dismiss
    </button>
  );
}

export function GettingStarted({
  steps,
  storeUrl,
}: {
  steps: OnboardingStep[];
  storeUrl: string;
}) {
  const [pending, start] = useTransition();
  const doneCount = steps.filter((s) => s.done).length;
  const activeIndex = steps.findIndex((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  const dismiss = () => start(async () => { await dismissOnboarding(); });

  return (
    <section className="overflow-hidden rounded-xl border border-accent/30 bg-accent-weak/40 shadow-[0_1px_2px_rgba(20,32,29,0.04)]">
      <header className="flex items-center justify-between gap-3 border-b border-accent/20 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Set up your shop</h2>
          <p className="text-xs text-muted">
            {doneCount} of {steps.length} done — a few minutes and you&apos;re live.
          </p>
        </div>
        <button
          onClick={dismiss}
          disabled={pending}
          className="shrink-0 text-xs text-muted hover:underline disabled:opacity-50"
        >
          Hide
        </button>
      </header>

      <div className="h-1 w-full bg-accent/15">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ol className="flex flex-col divide-y divide-accent/15">
        {steps.map((s, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={s.key} className="flex gap-3 px-4 py-3">
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  s.done
                    ? "border-ok bg-ok/10 text-ok"
                    : isActive
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line text-muted"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    s.done ? "text-muted line-through" : isActive ? "" : "text-muted"
                  }`}
                >
                  {s.title}
                </p>

                {isActive && (
                  <>
                    <p className="mt-1 text-xs text-muted">{s.blurb}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={s.href}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-fg hover:bg-accent/90"
                      >
                        {s.cta}
                      </Link>
                      {s.key === "order" && (
                        <a
                          href={storeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-card px-3 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50"
                        >
                          Open storefront
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
