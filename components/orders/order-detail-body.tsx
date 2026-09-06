"use client";

import { useState, useTransition } from "react";
import type { OrderDetail } from "@/lib/orders";
import { toCents, fromCents } from "@/lib/money";
import { StatusSelect } from "@/components/orders/order-status-select";
import { PaymentPill } from "@/components/orders/status-pill";
import {
  updatePaymentAction,
  updateOrderNoteAction,
  setCourierAction,
  type OrderState,
} from "@/app/actions/orders";

const EVENT_LABEL: Record<string, string> = {
  created: "Order created",
  status: "Order status changed",
  delivery: "Delivery updated",
  payment: "Payment updated",
  note: "Note updated",
  edited: "Order edited",
};

export function OrderDetailBody({
  order,
  currency,
  onChange,
}: {
  order: OrderDetail;
  currency: string;
  onChange?: () => void;
}) {
  const cur = currency;
  const balanceCents = toCents(order.total) - toCents(order.amountPaid);
  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

  return (
    <div className="flex flex-col gap-5">
      {/* top meta grid */}
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Meta k="Invoice" v={`#${order.orderNumber}`} />
          <Meta k="Sale date" v={new Date(order.createdAt).toLocaleDateString()} />
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-muted">Order status</span>
            <StatusSelect orderId={order.id} kind="order" value={order.status} onDone={onChange} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Meta k="Customer" v={order.customer?.name ?? "—"} />
          {order.customer?.phone && <Meta k="Phone" v={order.customer.phone} />}
          {order.customer?.address && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-muted">Address</span>
              <span className="whitespace-pre-line">{order.customer.address}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-muted">Delivery</span>
            <StatusSelect
              orderId={order.id}
              kind="delivery"
              value={order.deliveryStatus}
              onDone={onChange}
            />
          </div>
          <Meta k="Dispatched" v={fmtDate(order.dispatchedAt)} />
          <Meta k="Delivered" v={fmtDate(order.deliveredAt)} />
          <CourierField orderId={order.id} courier={order.courier} onDone={onChange} />
        </div>
      </div>

      {/* products */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface">
            <tr>
              <Th>#</Th>
              <Th>Product</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Unit price</Th>
              <Th className="text-right">Subtotal</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((it, i) => (
              <tr key={it.id}>
                <Td className="text-muted">{i + 1}</Td>
                <Td>{it.name}</Td>
                <Td className="text-right tabular-nums">{it.quantity}</Td>
                <Td className="text-right tabular-nums">{cur} {it.unitPrice}</Td>
                <Td className="text-right tabular-nums">{cur} {it.lineTotal}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* totals + payment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-3 text-sm">
          <Row k="Subtotal" v={`${cur} ${order.subtotal}`} />
          {order.discountType !== "none" && (
            <Row
              k={`Discount ${order.discountType === "percent" ? `(${order.discountValue}%)` : ""}`}
              v="(−)"
            />
          )}
          {Number(order.deliveryFee) > 0 && (
            <Row k="Delivery fee" v={`(+) ${cur} ${order.deliveryFee}`} />
          )}
          <div className="mt-1 border-t border-line pt-1">
            <Row k="Total" v={`${cur} ${order.total}`} bold />
            <Row k="Paid" v={`${cur} ${order.amountPaid}`} />
            <Row
              k="Balance"
              v={`${cur} ${fromCents(Math.max(0, balanceCents))}`}
              bold
              tone={balanceCents > 0 ? "danger" : "ok"}
            />
          </div>
        </div>

        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
              Payment
            </span>
            <PaymentPill status={order.paymentStatus} />
          </div>
          <PaymentForm
            orderId={order.id}
            paymentStatus={order.paymentStatus}
            amountPaid={order.amountPaid}
            currency={cur}
            onDone={onChange}
          />
        </div>
      </div>

      <NoteForm orderId={order.id} note={order.note ?? ""} onDone={onChange} />

      {/* timeline */}
      <div>
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
          Activity
        </p>
        <ul className="divide-y divide-line rounded-lg border border-line text-xs">
          {order.events.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 px-3 py-2">
              <span>
                {EVENT_LABEL[e.kind] ?? e.kind}
                {e.from && e.to ? ` · ${e.from} → ${e.to}` : ""}
                {e.note ? ` — ${e.note}` : ""}
              </span>
              <span className="shrink-0 text-muted">{new Date(e.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function Row({
  k,
  v,
  bold,
  tone,
}: {
  k: string;
  v: string;
  bold?: boolean;
  tone?: "danger" | "ok";
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-muted"}`}>
      <span>{k}</span>
      <span
        className={`tabular-nums ${tone === "danger" ? "text-danger" : tone === "ok" ? "text-accent" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-muted ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function CourierField({
  orderId,
  courier,
  onDone,
}: {
  orderId: string;
  courier: string | null;
  onDone?: () => void;
}) {
  const [value, setValue] = useState(courier ?? "");
  const [pending, start] = useTransition();
  const action = setCourierAction.bind(null, orderId);
  return (
    <form
      action={(fd) => start(async () => { await action(undefined, fd); onDone?.(); })}
      className="flex items-center gap-2"
    >
      <span className="w-24 shrink-0 text-muted">Courier</span>
      <input
        name="courier"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="—"
        className="h-7 w-32 rounded border border-line bg-surface px-2 text-xs outline-none focus:border-accent"
      />
      {value !== (courier ?? "") && (
        <button className="text-[10px] font-semibold uppercase tracking-widest text-accent" disabled={pending}>
          {pending ? "…" : "save"}
        </button>
      )}
    </form>
  );
}

function PaymentForm({
  orderId,
  paymentStatus,
  amountPaid,
  currency,
  onDone,
}: {
  orderId: string;
  paymentStatus: string;
  amountPaid: string;
  currency: string;
  onDone?: () => void;
}) {
  const [status, setStatus] = useState(paymentStatus);
  const [amount, setAmount] = useState(amountPaid);
  const [pending, start] = useTransition();
  const [state, setState] = useState<OrderState>(undefined);
  const action = updatePaymentAction.bind(null, orderId);

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await action(undefined, fd);
          setState(res);
          if (!res?.error && !res?.fieldErrors) onDone?.();
        })
      }
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <select
          name="paymentStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
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
          placeholder={currency}
          className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent disabled:opacity-40"
        />
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <button
        disabled={pending}
        className="self-start rounded-full border border-line px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
      >
        {pending ? "…" : "Update payment"}
      </button>
    </form>
  );
}

function NoteForm({
  orderId,
  note,
  onDone,
}: {
  orderId: string;
  note: string;
  onDone?: () => void;
}) {
  const [value, setValue] = useState(note);
  const [pending, start] = useTransition();
  const action = updateOrderNoteAction.bind(null, orderId);
  return (
    <form
      action={(fd) => start(async () => { await action(undefined, fd); onDone?.(); })}
      className="flex flex-col gap-1"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
        Note
      </span>
      <textarea
        name="note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {value !== note && (
        <button
          disabled={pending}
          className="self-start rounded-full border border-line px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
        >
          {pending ? "…" : "Save note"}
        </button>
      )}
    </form>
  );
}
