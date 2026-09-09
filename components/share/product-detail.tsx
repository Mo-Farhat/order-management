"use client";

import { useState } from "react";
import Link from "next/link";
import type { StorefrontProductDetail } from "@/lib/share";
import { useStorefrontCart } from "@/components/share/use-cart";
import { Step, Placeholder } from "@/components/share/shared";

export function ProductDetail({
  slug,
  data,
}: {
  slug: string;
  data: StorefrontProductDetail;
}) {
  const { tenant, product } = data;
  const cur = tenant.currency;
  const { lines, setQty, count } = useStorefrontCart(slug);
  const qty = lines[product.id] ?? 0;
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);
  const out = product.stockState === "out";

  function add(q: number) {
    setQty(product.id, q);
    if (q > 0 && qty === 0) {
      setAdded(true);
      setTimeout(() => setAdded(false), 900);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-6">
      <nav className="sf-eyebrow mb-5 flex items-center gap-2 text-muted">
        <Link href={`/s/${slug}`} className="hover:text-ink">
          Shop
        </Link>
        {product.category && (
          <>
            <span aria-hidden>·</span>
            <Link
              href={`/s/${slug}?category=${encodeURIComponent(product.category)}`}
              className="hover:text-ink"
            >
              {product.category}
            </Link>
          </>
        )}
      </nav>

      <div className="md:grid md:grid-cols-2 md:gap-10">
        <div className="overflow-hidden rounded-[4px] border border-line bg-card">
          <div className="aspect-square">
            {product.photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.photos[active]}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <Placeholder />
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-2">
              {product.photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`size-14 shrink-0 overflow-hidden rounded-[3px] border ${
                    i === active ? "border-[var(--sf-accent)]" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 md:mt-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">{product.name}</h1>
          <p className="font-mono text-base tabular-nums">
            {cur} {product.price}
            {product.stockState === "low" && (
              <span className="ml-2 text-xs text-muted">low stock</span>
            )}
            {out && <span className="ml-2 text-xs text-danger">sold out</span>}
          </p>
          {product.description && (
            <p className="mt-1 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card p-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {qty > 0 ? (
            <div className="flex items-center gap-3 rounded-[3px] border border-line px-2 py-1">
              <Step onClick={() => add(qty - 1)}>−</Step>
              <span className="w-5 text-center tabular-nums">{qty}</span>
              <Step onClick={() => add(qty + 1)}>+</Step>
            </div>
          ) : (
            <button
              type="button"
              disabled={out}
              onClick={() => add(1)}
              className="sf-eyebrow h-11 flex-1 rounded-[2px] text-[var(--sf-accent-fg)] transition-colors disabled:opacity-40"
              style={{ background: "var(--sf-accent)" }}
            >
              {added ? "Added ✓" : "Add to order"}
            </button>
          )}
          <Link
            href={`/s/${slug}${count > 0 ? "?cart=1" : ""}`}
            className="sf-eyebrow ml-auto flex h-11 items-center rounded-[2px] border border-line px-4 text-ink"
          >
            {count > 0 ? `Order (${count})` : "Back to shop"} →
          </Link>
        </div>
      </div>
    </main>
  );
}
