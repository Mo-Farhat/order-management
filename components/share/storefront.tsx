"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Storefront as StorefrontData } from "@/lib/share";
import { SORT_KEYS, type SortKey } from "@/lib/validation";
import { toCents } from "@/lib/money";
import { useStorefrontCart } from "@/components/share/use-cart";
import { Step, Placeholder } from "@/components/share/shared";
import { CartSheet } from "@/components/share/cart-sheet";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

export function Storefront({
  slug,
  storefront,
  openCart = false,
  category = "",
  sort = null,
}: {
  slug: string;
  storefront: StorefrontData;
  openCart?: boolean;
  category?: string;
  sort?: SortKey | null;
}) {
  const { tenant, products, cartProducts, masthead } = storefront;
  const cur = tenant.currency;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const { lines, setQty, count } = useStorefrontCart(slug);
  const [cartOpen, setCartOpen] = useState(openCart);
  const [pulse, setPulse] = useState<string | null>(null);

  const subtotalCents = Object.entries(lines).reduce((n, [id, q]) => {
    const p = cartProducts.find((x) => x.id === id);
    return p ? n + toCents(p.price) * q : n;
  }, 0);

  function add(id: string, q: number) {
    setQty(id, q);
    if (q > 0) {
      setPulse(id);
      setTimeout(() => setPulse((v) => (v === id ? null : v)), 350);
    }
  }

  function changeSort(next: string) {
    const sp = new URLSearchParams(params);
    if (next === "newest") sp.delete("sort");
    else sp.set("sort", next);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4">
        {masthead && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-card">
            {masthead.bannerUrl && (
              <div className="aspect-[3/1] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={masthead.bannerUrl} alt="" className="size-full object-cover" />
              </div>
            )}
            {(masthead.title || masthead.subtitle) && (
              <div className="px-5 py-4">
                {masthead.title && (
                  <h1 className="text-xl font-semibold">{masthead.title}</h1>
                )}
                {masthead.subtitle && (
                  <p className="mt-1 text-sm text-muted">{masthead.subtitle}</p>
                )}
              </div>
            )}
          </section>
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {products.length} item{products.length === 1 ? "" : "s"}
            {category && ` in ${category}`}
          </p>
          <label className="flex items-center gap-2 text-xs text-muted">
            Sort
            <select
              value={sort ?? storefront.sort}
              onChange={(e) => changeSort(e.target.value)}
              className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-ink outline-none focus:border-[var(--sf-accent)]"
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {category ? `Nothing in ${category} right now.` : "This shop hasn't added products yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
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
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted">
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
                          className="w-full rounded-lg py-1.5 text-xs font-semibold text-[var(--sf-accent-fg)] disabled:opacity-40"
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
            className="mx-auto flex h-12 max-w-6xl items-center justify-between rounded-lg px-5 text-sm font-semibold text-[var(--sf-accent-fg)]"
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
          products={cartProducts}
          onClose={() => setCartOpen(false)}
        />
      )}
    </>
  );
}
