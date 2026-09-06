"use client";

import { useState } from "react";
import Link from "next/link";
import type { Storefront as StorefrontData } from "@/lib/share";
import { toCents } from "@/lib/money";
import { useStorefrontCart } from "@/components/share/use-cart";
import { accentVars, StorefrontHeader, Step, Placeholder } from "@/components/share/shared";
import { CartSheet } from "@/components/share/cart-sheet";

export function Storefront({
  slug,
  storefront,
  openCart = false,
}: {
  slug: string;
  storefront: StorefrontData;
  openCart?: boolean;
}) {
  const { tenant, products, categories } = storefront;
  const cur = tenant.currency;

  const { lines, setQty, count } = useStorefrontCart(slug);
  const [category, setCategory] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(openCart);
  const [pulse, setPulse] = useState<string | null>(null);

  const shown = category ? products.filter((p) => p.category === category) : products;
  const subtotalCents = Object.entries(lines).reduce((n, [id, q]) => {
    const p = products.find((x) => x.id === id);
    return p ? n + toCents(p.price) * q : n;
  }, 0);

  function add(id: string, q: number) {
    setQty(id, q);
    if (q > 0) {
      setPulse(id);
      setTimeout(() => setPulse((v) => (v === id ? null : v)), 350);
    }
  }

  return (
    <div style={accentVars(tenant)} className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <StorefrontHeader tenant={tenant} />
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium"
          >
            Order
            {count > 0 && (
              <span
                className="flex min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white"
                style={{ background: "var(--sf-accent)" }}
              >
                {count}
              </span>
            )}
          </button>
        </div>
        {categories.length > 0 && (
          <div className="mx-auto flex max-w-lg gap-1.5 overflow-x-auto px-4 pb-2">
            <Chip active={category === ""} onClick={() => setCategory("")}>All</Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {tenant.sharePolicyText && (
          <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
            {tenant.sharePolicyText}
          </p>
        )}

        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {category ? `Nothing in ${category} right now.` : "This shop hasn't added products yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((p) => {
              const q = lines[p.id] ?? 0;
              const out = p.stockState === "out";
              return (
                <div
                  key={p.id}
                  className={`flex flex-col overflow-hidden rounded-xl border bg-card transition-transform ${
                    q > 0 ? "border-[var(--sf-accent)]" : "border-line"
                  } ${out ? "opacity-60" : ""} ${pulse === p.id ? "scale-[1.03]" : ""}`}
                >
                  <Link href={`/s/${slug}/${p.id}`} className="block aspect-square">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <Placeholder />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <Link
                      href={`/s/${slug}/${p.id}`}
                      className="line-clamp-2 text-xs font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {cur} {p.price}
                      {p.stockState === "low" && " · low stock"}
                      {out && " · out of stock"}
                    </p>
                    <div className="mt-auto pt-2">
                      {q > 0 ? (
                        <div className="flex items-center justify-between">
                          <Step onClick={() => add(p.id, q - 1)}>−</Step>
                          <span className="text-sm tabular-nums">{q}</span>
                          <Step onClick={() => add(p.id, q + 1)}>+</Step>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={out}
                          onClick={() => add(p.id, 1)}
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
        )}
      </main>

      {count > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card p-4"
        >
          <span
            className="mx-auto flex h-12 max-w-lg items-center justify-between rounded-full px-5 text-sm font-semibold text-white"
            style={{ background: "var(--sf-accent)" }}
          >
            <span>
              {count} item{count === 1 ? "" : "s"}
            </span>
            <span>
              {cur} {(subtotalCents / 100).toFixed(2)} · View order →
            </span>
          </span>
        </button>
      )}

      {cartOpen && (
        <CartSheet
          slug={slug}
          tenant={tenant}
          products={products}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
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
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-[var(--sf-accent)] bg-[var(--sf-accent)] text-white"
          : "border-line text-muted"
      }`}
    >
      {children}
    </button>
  );
}
