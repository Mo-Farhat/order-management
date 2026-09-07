"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/desk/ui";

export default function DeskError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <h1 className="text-lg font-semibold">This page didn&apos;t load</h1>
        <p className="max-w-sm text-sm text-muted">
          Something went wrong fetching your data. Try again in a moment.
        </p>
        {error.digest && (
          <p className="font-mono text-[10px] text-muted">Reference: {error.digest}</p>
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-fg"
          >
            Try again
          </button>
          <Link
            href="/desk"
            className="inline-flex h-9 items-center rounded-md border border-line px-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </Card>
  );
}
