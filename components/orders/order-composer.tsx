"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { searchCustomersAction, type OrderState } from "@/app/actions/orders";
import { computeTotals, toCents } from "@/lib/money";
import { FormError } from "@/components/form";

type Product = {
  id: string;
  name: string;
  price: string;
  stockQty: number;
  photoUrl: string | null;
};

type Line = { productId: string; quantity: number };

export type ComposerInitial = {
  customer: { id: string | null; name: string; phone: string };
  items: Line[];
  deliveryFee: string;
  discountType: "none" | "flat" | "percent";
  discountValue: string;
  note: string;
  shareCode?: string;
};

type Match = { id: string; name: string; phone: string; lastOrderAt: string | null };

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
  const [step, setStep] = useState<"customer" | "items" | "review">(
    mode === "edit" ? "items" : "customer",
  );

  // customer
  const [customerId, setCustomerId] = useState<string | null>(initial?.customer.id ?? null);
  const [custName, setCustName] = useState(initial?.customer.name ?? "");
  const [custPhone, setCustPhone] = useState(initial?.customer.phone ?? "");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searching, startSearch] = useTransition();

  // items
  const [lines, setLines] = useState<Line[]>(initial?.items ?? []);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // fees
  const [deliveryFee, setDeliveryFee] = useState(
    initial?.deliveryFee ?? deliveryFeeDefault ?? "",
  );
  const [discountType, setDiscountType] = useState<"none" | "flat" | "percent">(
    initial?.discountType ?? "none",
  );
  const [discountValue, setDiscountValue] = useState(initial?.discountValue ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

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
      discountValue: discountType === "percent" ? Number(discountValue || "0") : toCents(discountValue || "0"),
    });
  }, [lines, byId, deliveryFee, discountType, discountValue]);

  function fmt(cents: number) {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }

  function runSearch(term: string) {
    setCustPhone(term);
    setCustomerId(null);
    if (term.trim().length < 2) {
      setMatches([]);
      return;
    }
    startSearch(async () => setMatches(await searchCustomersAction(term)));
  }

  function setQty(productId: string, quantity: number) {
    setLines((prev) => {
      const others = prev.filter((l) => l.productId !== productId);
      return quantity > 0 ? [...others, { productId, quantity }] : others;
    });
  }
  function qtyOf(productId: string) {
    return lines.find((l) => l.productId === productId)?.quantity ?? 0;
  }

  const customerReady =
    !!customerId || (custName.trim().length >= 1 && custPhone.trim().length >= 6);

  function payload(confirm: boolean) {
    return JSON.stringify({
      customerId: customerId || undefined,
      customerName: customerId ? undefined : custName.trim(),
      customerPhone: customerId ? undefined : custPhone.trim(),
      items: lines,
      deliveryFee: deliveryFee || "",
      discountType,
      discountValue: discountValue || "",
      note: note.trim(),
      shareCode: initial?.shareCode,
      confirm,
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      {state?.fieldErrors &&
        Object.values(state.fieldErrors).flat().map((m) => (
          <p key={m} className="text-xs text-danger">{m}</p>
        ))}

      {/* STEP: customer */}
      {step === "customer" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Customer</h2>
          <input
            value={custPhone}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Phone number"
            inputMode="tel"
            className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-ink"
          />
          {searching && <p className="text-xs text-muted">Searching…</p>}
          {matches.length > 0 && (
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerId(m.id);
                      setCustName(m.name);
                      setCustPhone(m.phone);
                      setMatches([]);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-muted">
                      {m.lastOrderAt
                        ? `last order ${new Date(m.lastOrderAt).toLocaleDateString()}`
                        : "no orders yet"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!customerId && (
            <input
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Customer name (new customer)"
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-ink"
            />
          )}
          {customerId && (
            <p className="text-sm">
              Selected: <strong>{custName}</strong> · {custPhone}{" "}
              <button
                type="button"
                onClick={() => setCustomerId(null)}
                className="ml-1 text-xs text-muted underline"
              >
                change
              </button>
            </p>
          )}
          <button
            type="button"
            disabled={!customerReady}
            onClick={() => setStep("items")}
            className="mt-1 h-11 rounded-full bg-ink font-mono text-xs font-semibold uppercase tracking-widest text-paper disabled:opacity-40"
          >
            Next: items
          </button>
        </section>
      )}

      {/* STEP: items */}
      {step === "items" && (
        <section className="flex flex-col gap-3 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Items</h2>
            {mode === "new" && (
              <button
                type="button"
                onClick={() => setStep("customer")}
                className="text-xs text-muted underline"
              >
                ← customer
              </button>
            )}
          </div>
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
                    q > 0 ? "border-ink" : "border-line"
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
                      <button
                        type="button"
                        onClick={() => setQty(p.id, q - 1)}
                        className="flex size-7 items-center justify-center rounded border border-line"
                      >
                        −
                      </button>
                      <span className="text-sm">{q}</span>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, q + 1)}
                        className="flex size-7 items-center justify-center rounded border border-line"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper p-3">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
              <span className="text-sm">
                {lines.reduce((n, l) => n + l.quantity, 0)} items · {fmt(totals.subtotalCents)}
              </span>
              <button
                type="button"
                disabled={lines.length === 0}
                onClick={() => setStep("review")}
                className="h-10 rounded-full bg-ink px-5 font-mono text-xs font-semibold uppercase tracking-widest text-paper disabled:opacity-40"
              >
                Review
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP: review */}
      {step === "review" && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Review &amp; save</h2>
            <button
              type="button"
              onClick={() => setStep("items")}
              className="text-xs text-muted underline"
            >
              ← items
            </button>
          </div>

          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
            {lines.map((l) => {
              const p = byId.get(l.productId);
              if (!p) return null;
              return (
                <li key={l.productId} className="flex items-center gap-2 p-2 text-sm">
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted">{currency} {p.price}</span>
                  <button type="button" onClick={() => setQty(l.productId, l.quantity - 1)} className="size-6 rounded border border-line">−</button>
                  <span className="w-6 text-center">{l.quantity}</span>
                  <button type="button" onClick={() => setQty(l.productId, l.quantity + 1)} className="size-6 rounded border border-line">+</button>
                  <button type="button" onClick={() => setQty(l.productId, 0)} className="ml-1 text-xs text-danger">remove</button>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-muted">Delivery fee</span>
              <input
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-muted">Discount</span>
              <div className="flex gap-1">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                  className="h-10 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-ink"
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
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink disabled:opacity-40"
                />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-mono uppercase tracking-widest text-muted">Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. wants it before Friday"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
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

          {mode === "new" ? (
            <div className="flex gap-2">
              <SubmitAs label="Save as draft" confirm={false} build={payload} className="flex-1 border border-line" />
              <SubmitAs label="Confirm order" confirm build={payload} className="flex-1 bg-ink text-paper" />
            </div>
          ) : (
            <SubmitAs label="Save changes" confirm={false} build={payload} className="bg-ink text-paper" />
          )}
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

function SubmitAs({
  label,
  confirm,
  build,
  className = "",
}: {
  label: string;
  confirm: boolean;
  build: (confirm: boolean) => string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={() => {
        const el = document.getElementById("order-payload") as HTMLInputElement | null;
        if (el) el.value = build(confirm);
      }}
      className={`h-11 rounded-full px-5 font-mono text-xs font-semibold uppercase tracking-widest ${className}`}
    >
      {label}
    </button>
  );
}
