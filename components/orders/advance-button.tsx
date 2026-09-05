"use client";

import { useState, useTransition } from "react";
import { advanceOrderAction } from "@/app/actions/orders";

export function AdvanceButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await advanceOrderAction(orderId);
            setError(res?.error ?? null);
          })
        }
        className="w-full rounded border border-line py-1 font-mono text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
      >
        {pending ? "…" : "Advance →"}
      </button>
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
    </div>
  );
}
