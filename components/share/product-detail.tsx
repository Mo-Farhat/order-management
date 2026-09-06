"use client";

import { useState } from "react";
import Link from "next/link";
import type { StorefrontProductDetail } from "@/lib/share";
import { useStorefrontCart } from "@/components/share/use-cart";
import { accentVars, StorefrontHeader, Step, Placeholder } from "@/components/share/shared";

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
    <main style={accentVars(tenant)} className="mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-6">
      <StorefrontHeader tenant={tenant} backHref={`/s/${slug}`} />

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card">
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
                className={`size-14 shrink-0 overflow-hidden rounded-lg border ${
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

      <div className="mt-4 flex flex-col gap-2">
        {product.category && (
          <Link
            href={`/s/${slug}`}
            className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted hover:text-ink"
          >
            {product.category}
          </Link>
        )}
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <p className="text-lg">
          {cur} {product.price}
          {product.stockState === "low" && (
            <span className="ml-2 text-sm text-muted">low stock</span>
          )}
          {out && <span className="ml-2 text-sm text-danger">out of stock</span>}
        </p>
        {product.description && (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
            {product.description}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card p-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {qty > 0 ? (
            <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
              <Step onClick={() => add(qty - 1)}>−</Step>
              <span className="w-5 text-center tabular-nums">{qty}</span>
              <Step onClick={() => add(qty + 1)}>+</Step>
            </div>
          ) : (
            <button
              type="button"
              disabled={out}
              onClick={() => add(1)}
              className="h-11 flex-1 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: "var(--sf-accent)" }}
            >
              {added ? "Added ✓" : "Add to order"}
            </button>
          )}
          <Link
            href={`/s/${slug}${count > 0 ? "?cart=1" : ""}`}
            className="ml-auto flex h-11 items-center rounded-full border border-line px-4 text-sm font-medium"
          >
            {count > 0 ? `Order (${count})` : "Back to shop"} →
          </Link>
        </div>
      </div>
    </main>
  );
}
