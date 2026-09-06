"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { startShareHandoff } from "@/app/actions/share";
import type { StorefrontProduct, StorefrontTenant } from "@/lib/share";
import { toCents } from "@/lib/money";
import { Step, Placeholder } from "@/components/share/shared";
import { useStorefrontCart } from "@/components/share/use-cart";

type Field = "name" | "phone" | "address";

function validate(v: Record<Field, string>): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 1) e.name = "Enter your name.";
  if (!/^\+?[0-9\s-]{6,}$/.test(v.phone.trim())) e.phone = "Enter a valid phone number.";
  if (v.address.trim().length < 5) e.address = "Enter your full delivery address.";
  return e;
}

export function CartSheet({
  slug,
  tenant,
  products,
  onClose,
}: {
  slug: string;
  tenant: StorefrontTenant;
  products: StorefrontProduct[];
  onClose: () => void;
}) {
  const cur = tenant.currency;
  const { lines, setQty, clear, count } = useStorefrontCart(slug);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [view, setView] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState<Record<Field, string>>({ name: "", phone: "", address: "" });
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showAll, setShowAll] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; url: string } | null>(null);

  const items = Object.entries(lines)
    .filter(([id, q]) => q > 0 && byId.has(id))
    .map(([id, q]) => ({ product: byId.get(id)!, quantity: q }));
  const subtotalCents = items.reduce((n, i) => n + toCents(i.product.price) * i.quantity, 0);
  const errs = validate(form);
  const isValid = Object.keys(errs).length === 0;

  // lock body scroll while the sheet is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function submit() {
    setShowAll(true);
    if (!isValid) return;
    setError(null);
    start(async () => {
      const res = await startShareHandoff({
        slug,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        note: note.trim() || undefined,
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        deliveryAddress: form.address.trim(),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { code, message, waNumber } = res.result;
      const url = waNumber
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      setDone({ code, url });
      window.open(url, "_blank");
    });
  }

  const fieldErr = (f: Field) => (touched[f] || showAll ? errs[f] : undefined);
  const inputCls = (f: Field) =>
    `h-11 w-full rounded-lg border bg-surface px-3 text-sm outline-none focus:border-[var(--sf-accent)] ${
      fieldErr(f) ? "border-danger" : "border-line"
    }`;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-line bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {view === "checkout" && !done && (
              <button
                onClick={() => setView("cart")}
                aria-label="Back to cart"
                className="flex size-7 items-center justify-center rounded-full border border-line text-sm"
              >
                ←
              </button>
            )}
            <h2 className="text-sm font-semibold">
              {done ? "Order ready" : view === "cart" ? `Your order (${count})` : "Your details"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {/* SUCCESS */}
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-full text-2xl text-white"
                style={{ background: "var(--sf-accent)" }}
              >
                ✓
              </div>
              <p className="text-sm font-medium">Sent to WhatsApp.</p>
              <p className="text-xs text-muted">
                Reference code <span className="font-mono font-semibold">{done.code}</span> — the
                seller uses this to confirm your order.
              </p>
              <a
                href={done.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: "var(--sf-accent)" }}
              >
                Open WhatsApp
              </a>
              <button
                onClick={() => {
                  clear();
                  onClose();
                }}
                className="text-xs text-muted underline"
              >
                Done
              </button>
            </div>
          ) : view === "cart" ? (
            /* CART */
            items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                Your order is empty. Add something from the shop.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3 py-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg">
                      {product.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <Placeholder />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted">
                        {cur} {product.price} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Step onClick={() => setQty(product.id, quantity - 1)}>−</Step>
                      <span className="w-5 text-center text-sm tabular-nums">{quantity}</span>
                      <Step onClick={() => setQty(product.id, quantity + 1)}>+</Step>
                    </div>
                    <button
                      onClick={() => setQty(product.id, 0)}
                      aria-label={`Remove ${product.name}`}
                      className="ml-1 text-xs text-danger"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            /* CHECKOUT */
            <div className="flex flex-col gap-3 py-2">
              {(["name", "phone", "address"] as Field[]).map((f) => (
                <label key={f} className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {f === "name" ? "Your name" : f === "phone" ? "Phone" : "Delivery address"}
                  </span>
                  <input
                    value={form[f]}
                    inputMode={f === "phone" ? "tel" : "text"}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                    onBlur={() => setTouched({ ...touched, [f]: true })}
                    className={inputCls(f)}
                  />
                  {fieldErr(f) && <span className="text-xs text-danger">{fieldErr(f)}</span>}
                </label>
              ))}
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Note for the seller <span className="normal-case text-muted/70">(optional)</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-[var(--sf-accent)]"
                />
              </label>
              {error && (
                <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTION */}
        {!done && (
          <div className="border-t border-line px-4 py-3">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium tabular-nums">
                {cur} {(subtotalCents / 100).toFixed(2)}
              </span>
            </div>
            {view === "cart" ? (
              <button
                disabled={items.length === 0}
                onClick={() => setView("checkout")}
                className="h-12 w-full rounded-full text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--sf-accent)" }}
              >
                Continue
              </button>
            ) : (
              <button
                disabled={pending}
                onClick={submit}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--sf-accent)" }}
              >
                {pending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  "Order on WhatsApp"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
