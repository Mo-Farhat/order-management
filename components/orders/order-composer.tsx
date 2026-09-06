"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { OrderState } from "@/app/actions/orders";
import { computeTotals, toCents } from "@/lib/money";
import { FormError } from "@/components/form";

type Product = {
  id: string;
  name: string;
  price: string;
  stockQty: number;
  photoUrl: string | null;
};

type Line = { productId: string; quantity: number; note?: string };
type PaymentStatus = "unpaid" | "partial" | "paid";
type DiscountType = "none" | "flat" | "percent";

export type ComposerInitial = {
  customer: { id: string | null; name: string; phone: string };
  deliveryAddress: string;
  courier: string;
  items: Line[];
  deliveryFee: string;
  discountType: DiscountType;
  discountValue: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  note: string;
};

export function OrderComposer({
  products,
  currency,
  deliveryFeeDefault,
  action,
  mode,
  initial,
  stockTracking = true,
}: {
  products: Product[];
  currency: string;
  deliveryFeeDefault: string | null;
  action: (prev: OrderState, fd: FormData) => Promise<OrderState>;
  mode: "new" | "edit";
  initial?: ComposerInitial;
  stockTracking?: boolean;
}) {
  const [state, formAction] = useActionState<OrderState, FormData>(action, undefined);
  const [step, setStep] = useState<"details" | "review">("details");
  const lockCustomer = mode === "edit";

  const [custName, setCustName] = useState(initial?.customer.name ?? "");
  const [custPhone, setCustPhone] = useState(initial?.customer.phone ?? "");
  const [address, setAddress] = useState(initial?.deliveryAddress ?? "");
  const [courier, setCourier] = useState(initial?.courier ?? "");
  const [lines, setLines] = useState<Line[]>(initial?.items ?? []);
  const [deliveryFee, setDeliveryFee] = useState(
    initial?.deliveryFee ?? deliveryFeeDefault ?? "",
  );
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? "none");
  const [discountValue, setDiscountValue] = useState(initial?.discountValue ?? "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initial?.paymentStatus ?? "unpaid",
  );
  const [amountPaid, setAmountPaid] = useState(initial?.amountPaid ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const totals = useMemo(() => {
    const items = lines
      .map((l) => {
        const p = byId.get(l.productId);
        return p ? { priceCents: toCents(p.price), quantity: l.quantity } : null;
      })
      .filter((x): x is { priceCents: number; quantity: number } => !!x);
    return computeTotals({
      items,
      deliveryFeeCents: toCents(deliveryFee || "0"),
      discountType,
      discountValue:
        discountType === "percent" ? Number(discountValue || "0") : toCents(discountValue || "0"),
    });
  }, [lines, byId, deliveryFee, discountType, discountValue]);

  const fmt = (cents: number) => `${currency} ${(cents / 100).toFixed(2)}`;

  function setQty(productId: string, quantity: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      const others = prev.filter((l) => l.productId !== productId);
      return quantity > 0
        ? [...others, { productId, quantity, note: existing?.note }]
        : others;
    });
  }
  function setLineNote(productId: string, note: string) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, note } : l)));
  }
  const qtyOf = (id: string) => lines.find((l) => l.productId === id)?.quantity ?? 0;

  const detailsReady =
    custName.trim().length >= 1 &&
    custPhone.trim().length >= 6 &&
    address.trim().length >= 5 &&
    lines.length > 0;

  function payload() {
    return JSON.stringify({
      customerId: initial?.customer.id || undefined,
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      deliveryAddress: address.trim(),
      courier: courier.trim() || undefined,
      items: lines,
      deliveryFee: deliveryFee || "",
      discountType,
      discountValue: discountValue || "",
      paymentStatus,
      amountPaid: paymentStatus === "unpaid" ? "" : amountPaid || "",
      note: note.trim(),
    });
  }

  const inputCls =
    "h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-accent disabled:opacity-60";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      {state?.fieldErrors &&
        Object.values(state.fieldErrors)
          .flat()
          .map((m) => (
            <p key={m} className="text-xs text-danger">{m}</p>
          ))}

      {/* STEP: details */}
      {step === "details" && (
        <section className="flex flex-col gap-4 pb-24">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
                Customer name
              </span>
              <input
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Nimali Perera"
                disabled={lockCustomer}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
                Phone
              </span>
              <input
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                inputMode="tel"
                placeholder="+94…"
                disabled={lockCustomer}
                className={inputCls}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
              Delivery address
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Street, city, notes for the courier"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-base outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
              Courier <span className="normal-case text-muted/70">(optional)</span>
            </span>
            <input
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="e.g. Citypack, Pronto"
              className={inputCls}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
              Items
            </span>
            {products.length === 0 && (
              <p className="text-sm text-muted">No products in your catalog yet.</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {products.map((p) => {
                const q = qtyOf(p.id);
                const out = stockTracking && p.stockQty <= 0;
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col rounded-lg border p-2 ${
                      q > 0 ? "border-accent" : "border-line"
                    } ${out ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      disabled={out && q === 0}
                      onClick={() => setQty(p.id, q > 0 ? q : 1)}
                      className="flex flex-1 flex-col items-start gap-1 text-left"
                    >
                      <span className="line-clamp-2 text-xs font-medium">{p.name}</span>
                      <span className="text-xs text-muted">
                        {currency} {p.price}
                        {stockTracking && (out ? " · out of stock" : ` · ${p.stockQty} left`)}
                      </span>
                    </button>
                    {q > 0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <button type="button" onClick={() => setQty(p.id, q - 1)} className="flex size-7 items-center justify-center rounded border border-line">−</button>
                        <span className="text-sm">{q}</span>
                        <button type="button" onClick={() => setQty(p.id, q + 1)} className="flex size-7 items-center justify-center rounded border border-line">+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card p-3">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-2">
              <span className="text-sm">
                {lines.reduce((n, l) => n + l.quantity, 0)} items · {fmt(totals.subtotalCents)}
              </span>
              <button
                type="button"
                disabled={!detailsReady}
                onClick={() => setStep("review")}
                className="h-10 rounded-md bg-accent px-5 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg disabled:opacity-40"
              >
                Review →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP: review */}
      {step === "review" && (
        <section className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="self-start text-xs text-muted underline"
          >
            ← back to details
          </button>

          <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            <span className="font-medium">{custName || "—"}</span>
            {custPhone && <span className="text-muted"> · {custPhone}</span>}
            {address && <p className="mt-0.5 text-xs text-muted">{address}</p>}
          </div>

          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
            {lines.map((l) => {
              const p = byId.get(l.productId);
              if (!p) return null;
              return (
                <li key={l.productId} className="flex flex-col gap-1.5 p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-muted">{currency} {p.price}</span>
                    <button type="button" onClick={() => setQty(l.productId, l.quantity - 1)} className="size-6 rounded border border-line">−</button>
                    <span className="w-6 text-center">{l.quantity}</span>
                    <button type="button" onClick={() => setQty(l.productId, l.quantity + 1)} className="size-6 rounded border border-line">+</button>
                    <button type="button" onClick={() => setQty(l.productId, 0)} className="ml-1 text-xs text-danger">remove</button>
                  </div>
                  <input
                    value={l.note ?? ""}
                    onChange={(e) => setLineNote(l.productId, e.target.value)}
                    maxLength={200}
                    placeholder="Note for this item (size, colour, name…)"
                    className="h-8 w-full rounded border border-line bg-surface px-2 text-xs outline-none focus:border-accent"
                  />
                </li>
              );
            })}
          </ul>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-muted">Delivery fee</span>
              <input
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-muted">Discount</span>
              <div className="flex gap-1">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="h-10 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
                >
                  <option value="none">None</option>
                  <option value="flat">{currency}</option>
                  <option value="percent">%</option>
                </select>
                <input
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent disabled:opacity-40"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-muted">Payment</span>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="h-10 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            {paymentStatus !== "unpaid" && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-mono uppercase tracking-widest text-muted">Amount paid</span>
                <input
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  inputMode="decimal"
                  placeholder={paymentStatus === "paid" ? fmt(totals.totalCents).replace(`${currency} `, "") : "0"}
                  className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
                />
              </label>
            )}
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono uppercase tracking-widest text-muted">Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. wants it before Friday"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <div className="rounded-lg border border-line bg-surface p-3 text-sm">
            <Row label="Subtotal" value={fmt(totals.subtotalCents)} />
            {totals.discountCents > 0 && <Row label="Discount" value={`− ${fmt(totals.discountCents)}`} />}
            {toCents(deliveryFee) > 0 && <Row label="Delivery" value={fmt(toCents(deliveryFee))} />}
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-medium">
              <span>Total</span>
              <span>{fmt(totals.totalCents)}</span>
            </div>
          </div>

          <input type="hidden" name="payload" value="" id="order-payload" />

          <SubmitBtn
            label={mode === "new" ? "Create order" : "Save changes"}
            build={payload}
          />
        </section>
      )}
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SubmitBtn({ label, build }: { label: string; build: () => string }) {
  return (
    <button
      type="submit"
      onClick={() => {
        const el = document.getElementById("order-payload") as HTMLInputElement | null;
        if (el) el.value = build();
      }}
      className="h-11 rounded-md bg-accent px-5 font-mono text-xs font-semibold uppercase tracking-widest text-accent-fg"
    >
      {label}
    </button>
  );
}
