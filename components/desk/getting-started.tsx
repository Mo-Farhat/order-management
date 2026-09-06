"use client";

import Link from "next/link";
import { useTransition } from "react";
import { dismissOnboarding } from "@/app/actions/getting-started";
import type { OnboardingStep } from "@/lib/onboarding";
import { Card } from "@/components/desk/ui";

export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const [pending, start] = useTransition();
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card
      title={`Get started (${doneCount}/${steps.length})`}
      actions={
        <button
          onClick={() => start(async () => { await dismissOnboarding(); })}
          disabled={pending}
          className="text-xs text-muted hover:underline disabled:opacity-50"
        >
          Dismiss
        </button>
      }
    >
      <ul className="flex flex-col divide-y divide-line">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3 py-2.5 text-sm">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                s.done ? "border-ok bg-ok/10 text-ok" : "border-line text-muted"
              }`}
            >
              {s.done ? "✓" : ""}
            </span>
            {s.done ? (
              <span className="text-muted line-through">{s.title}</span>
            ) : (
              <Link href={s.href} className="font-medium hover:underline">
                {s.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
