"use client";

import { useMemo, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { startShareHandoff } from "@/app/actions/share";
import type { Storefront as StorefrontData } from "@/lib/share";
import { computeTotals, toCents } from "@/lib/money";

export function Storefront({
  slug,
  storefront,
}: {
  slug: string;
  storefront: StorefrontData;
}) {
  const { tenant, products } = storefront;
  const accent = tenant.accentColor || "#0f7b6c";
  const cur = tenant.currency;

  const [lines, setLines] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<{ code: string; url: string; message: string } | null>(null);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[],
    [products],
  );
  const shown = category ? products.filter((p) => p.category === category) : products;

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = Object.entries(lines).filter(([, q]) => q > 0);
  const totals = computeTotals({
    items: selected.map(([id, q]) => ({ priceCents: toCents(byId.get(id)!.price), quantity: q })),
    deliveryFeeCents: 0,
    discountType: "none",
    discountValue: 0,
  });
  const count = selected.reduce((n, [, q]) => n + q, 0);

  function setQty(id: string, q: number) {
    setLines((prev) => ({ ...prev, [id]: Math.max(0, q) }));
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await startShareHandoff({
        slug,
        items: selected.map(([productId, quantity]) => ({ productId, quantity })),
        note: note.trim() || undefined,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { code, message, waNumber } = res.result;
      const url = waNumber
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      setHandoff({ code, url, message });
      window.open(url, "_blank");
    });
  }

  const accentStyle = { "--sf-accent": accent } as CSSProperties;

  return (
    <main style={accentStyle} className="mx-auto w-full max-w-lg flex-1 px-4 pb-40 pt-6">
      <header className="flex items-center gap-3">
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt="" className="size-12 rounded-xl object-cover" />
        ) : (
          <span
            className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: "var(--sf-accent)" }}
          >
            {tenant.name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="text-lg font-semibold">{tenant.name}</h1>
          <p className="text-xs text-muted">Browse and send your order on WhatsApp</p>
        </div>
      </header>

      {tenant.sharePolicyText && (
        <p className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          {tenant.sharePolicyText}
        </p>
      )}

      {categories.length > 0 && (
        <div className="mt-4 flex gap-1.5 overflow-x-auto">
          <Chip active={category === ""} onClick={() => setCategory("")}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {shown.map((p) => {
          const q = lines[p.id] ?? 0;
          const out = p.stockState === "out";
          return (
            <div
              key={p.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-card ${
                q > 0 ? "border-[var(--sf-accent)]" : "border-line"
              } ${out ? "opacity-60" : ""}`}
            >
              <div className="aspect-square bg-surface">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center font-mono text-[10px] text-muted">
                    no photo
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2.5">
                <p className="line-clamp-2 text-xs font-medium">{p.name}</p>
                <p className="text-xs text-muted">
                  {cur} {p.price}
                  {p.stockState === "low" && " · low stock"}
                  {out && " · out of stock"}
                </p>
                <div className="mt-auto pt-2">
                  {q > 0 ? (
                    <div className="flex items-center justify-between">
                      <Step onClick={() => setQty(p.id, q - 1)}>−</Step>
                      <span className="text-sm tabular-nums">{q}</span>
                      <Step onClick={() => setQty(p.id, q + 1)}>+</Step>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={out}
                      onClick={() => setQty(p.id, 1)}
                      className="w-full rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: "var(--sf-accent)" }}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && !handoff && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card p-4">
          <div className="mx-auto flex max-w-lg flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="Your phone (optional)"
                className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any request for the seller (optional)"
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--sf-accent)" }}
            >
              {pending ? "…" : `Order on WhatsApp · ${cur} ${(totals.subtotalCents / 100).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {handoff && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-card p-4">
          <div className="mx-auto flex max-w-lg flex-col gap-2 text-center">
            <p className="text-sm font-medium">Your order is ready to send.</p>
            <p className="text-xs text-muted">
              Reference <span className="font-mono font-semibold">{handoff.code}</span> — if WhatsApp
              didn&apos;t open, tap below.
            </p>
            <a
              href={handoff.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--sf-accent)" }}
            >
              Open WhatsApp
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
        active ? "border-[var(--sf-accent)] text-ink" : "border-line text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Step({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-lg border border-line text-sm"
    >
      {children}
    </button>
  );
}
