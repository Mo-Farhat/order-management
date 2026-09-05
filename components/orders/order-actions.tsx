"use client";

import { useActionState, useState, useTransition } from "react";
import {
  advanceOrderAction,
  cancelOrderAction,
  returnOrderAction,
  type OrderState,
} from "@/app/actions/orders";
import type { OrderStatus } from "@/db/schema";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  draft: "Confirm order",
  confirmed: "Mark packed",
  packed: "Mark shipped",
  shipped: "Mark delivered",
};

export function OrderActions({
  orderId,
  status,
  canAdvance,
  canCancel,
  canReturn,
}: {
  orderId: string;
  status: OrderStatus;
  canAdvance: boolean;
  canCancel: boolean;
  canReturn: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "cancel" | "return">("none");

  const [cancelState, cancelAction] = useActionState<OrderState, FormData>(
    cancelOrderAction.bind(null, orderId),
    undefined,
  );
  const [returnState, returnAction] = useActionState<OrderState, FormData>(
    returnOrderAction.bind(null, orderId),
    undefined,
  );

  return (
    <div className="flex flex-col gap-3">
      {canAdvance && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await advanceOrderAction(orderId);
              if (res?.error) setError(res.error);
            })
          }
          className="h-12 rounded-full bg-ink font-mono text-xs font-semibold uppercase tracking-widest text-paper disabled:opacity-50"
        >
          {NEXT_LABEL[status] ?? "Advance"}
        </button>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        {canCancel && mode !== "cancel" && (
          <button
            type="button"
            onClick={() => setMode("cancel")}
            className="text-xs text-danger underline underline-offset-4"
          >
            Cancel order
          </button>
        )}
        {canReturn && mode !== "return" && (
          <button
            type="button"
            onClick={() => setMode("return")}
            className="text-xs text-muted underline underline-offset-4"
          >
            Mark returned
          </button>
        )}
      </div>

      {mode === "cancel" && (
        <form action={cancelAction} className="flex flex-col gap-2 rounded-lg border border-danger/40 p-3">
          <p className="text-sm">Cancel this order? Stock (if confirmed) goes back.</p>
          <input name="reason" placeholder="Reason (optional)" className="h-9 rounded border border-line bg-surface px-2 text-sm" />
          {cancelState?.error && <p className="text-xs text-danger">{cancelState.error}</p>}
          <div className="flex gap-2">
            <button className="rounded-full bg-danger px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-white">
              Confirm cancel
            </button>
            <button type="button" onClick={() => setMode("none")} className="text-xs text-muted underline">
              Keep order
            </button>
          </div>
        </form>
      )}

      {mode === "return" && (
        <form action={returnAction} className="flex flex-col gap-2 rounded-lg border border-line p-3">
          <p className="text-sm">Mark as returned? Stock goes back.</p>
          <input name="reason" placeholder="Reason (optional)" className="h-9 rounded border border-line bg-surface px-2 text-sm" />
          {returnState?.error && <p className="text-xs text-danger">{returnState.error}</p>}
          <div className="flex gap-2">
            <button className="rounded-full bg-ink px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-paper">
              Confirm return
            </button>
            <button type="button" onClick={() => setMode("none")} className="text-xs text-muted underline">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
