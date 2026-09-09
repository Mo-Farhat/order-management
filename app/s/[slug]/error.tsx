"use client";

import { useEffect } from "react";

export default function StorefrontError({
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
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">This shop didn&apos;t load</h1>
      <p className="max-w-sm text-sm text-muted">
        Something went wrong. Try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center rounded-[3px] px-5 text-sm font-semibold text-white"
        style={{ background: "var(--sf-accent, #0e1116)" }}
      >
        Try again
      </button>
    </main>
  );
}
