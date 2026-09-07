"use client";

import { useEffect } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Error({
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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        {APP_NAME}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error stopped this page from loading. Try again — if it keeps
        happening, let us know.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] text-muted">Reference: {error.digest}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg"
        >
          Try again
        </button>
        <Link
          href="/desk"
          className="inline-flex h-10 items-center rounded-md border border-line px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink"
        >
          Back to the desk
        </Link>
      </div>
    </main>
  );
}
