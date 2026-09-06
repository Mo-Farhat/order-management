"use client";

import { useActionState, useState } from "react";
import { updatePaymentAction, type OrderState } from "@/app/actions/orders";
import type { PaymentStatus } from "@/db/schema";
import { Btn } from "@/components/desk/ui";

export function PaymentEditor({
  orderId,
  paymentStatus,
  amountPaid,
  total,
  currency,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  total: string;
  currency: string;
}) {
  const action = updatePaymentAction.bind(null, orderId);
  const [state, formAction] = useActionState<OrderState, FormData>(action, undefined);
  const [status, setStatus] = useState<PaymentStatus>(paymentStatus);
  const [amount, setAmount] = useState(amountPaid);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <select
          name="paymentStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          className="h-10 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
        >
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <input
          name="amountPaid"
          value={status === "unpaid" ? "" : amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={status === "unpaid"}
          inputMode="decimal"
          placeholder={`of ${currency} ${total}`}
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent disabled:opacity-40"
        />
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="text-xs text-accent">{state.ok}</p>}
      <Btn type="submit" size="sm" variant="outline" className="self-start">Update payment</Btn>
    </form>
  );
}
