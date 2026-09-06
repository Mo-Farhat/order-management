"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTS: [string, string][] = [
  ["7", "7 days"],
  ["30", "30 days"],
  ["90", "90 days"],
  ["all", "All time"],
];

export function RangeTabs() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("range") ?? "30";

  return (
    <div className="flex gap-1 rounded-lg border border-line bg-card p-1">
      {OPTS.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => router.push(`/admin?range=${v}`)}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            current === v ? "bg-accent text-accent-fg" : "text-muted hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
