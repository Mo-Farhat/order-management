"use client";

import { useActionState } from "react";
import { updateOrderNoteAction, type OrderState } from "@/app/actions/orders";

export function OrderNote({ orderId, note }: { orderId: string; note: string }) {
  const [state, action] = useActionState<OrderState, FormData>(
    updateOrderNoteAction.bind(null, orderId),
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
        Note
      </span>
      <textarea
        name="note"
        defaultValue={note}
        rows={2}
        placeholder="e.g. wants it before Friday"
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <div className="flex items-center gap-3">
        <button className="self-start rounded-full border border-line px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest">
          Save note
        </button>
        {state?.ok && <span className="text-xs text-muted">{state.ok}</span>}
        {state?.error && <span className="text-xs text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
