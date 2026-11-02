"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StorefrontProductDetail } from "@/lib/share";
import { lineKey, useStorefrontCart } from "@/components/share/use-cart";
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
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  // Options: pick a value per option; the matching variant is what's added.
  const hasOptions = product.variants.length > 0;
  const values1 = useMemo(
    () => [...new Set(product.variants.map((v) => v.option1))],
    [product.variants],
  );
  const values2 = useMemo(
    () => [...new Set(product.variants.map((v) => v.option2).filter((x): x is string => !!x))],
    [product.variants],
  );
  const twoOptions = product.optionNames.length > 1;
  // Pre-select when there's only one choice, so a one-option product isn't a puzzle.
  const [sel1, setSel1] = useState<string | null>(values1.length === 1 ? values1[0] : null);
  const [sel2, setSel2] = useState<string | null>(values2.length === 1 ? values2[0] : null);
  const variant = hasOptions
    ? (product.variants.find(
        (v) => v.option1 === sel1 && (!twoOptions || v.option2 === sel2),
      ) ?? null)
    : null;
  const missing = hasOptions && !variant
    ? !sel1
      ? product.optionNames[0]
      : twoOptions && !sel2
        ? product.optionNames[1]
        : null
    : null;
  const comboOut = (o1: string, o2: string | null) => {
    const v = product.variants.find((x) => x.option1 === o1 && (!twoOptions || x.option2 === o2));
    return !v || v.stockState === "out";
  };

  const key = lineKey(product.id, variant?.id);
  const qty = hasOptions && !variant ? 0 : (lines[key] ?? 0);
  const out = hasOptions ? (variant ? variant.stockState === "out" : product.stockState === "out") : product.stockState === "out";
  const price = variant?.price ?? product.price;
  const stockState = variant?.stockState ?? product.stockState;

  function add(q: number) {
    if (hasOptions && !variant) return;
    setQty(key, q);
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
            {hasOptions && !variant && product.priceVaries && "from "}
            {cur} {price}
            {stockState === "low" && <span className="ml-2 text-xs text-muted">low stock</span>}
            {out && <span className="ml-2 text-xs text-danger">sold out</span>}
          </p>

          {hasOptions && (
            <div className="mt-1 flex flex-col gap-4">
              <OptionPicker
                name={product.optionNames[0]}
                values={values1}
                selected={sel1}
                onSelect={setSel1}
                isOut={(v) =>
                  twoOptions
                    ? sel2
                      ? comboOut(v, sel2)
                      : values2.every((o2) => comboOut(v, o2))
                    : comboOut(v, null)
                }
              />
              {twoOptions && (
                <OptionPicker
                  name={product.optionNames[1]}
                  values={values2}
                  selected={sel2}
                  onSelect={setSel2}
                  isOut={(v) =>
                    sel1 ? comboOut(sel1, v) : values1.every((o1) => comboOut(o1, v))
                  }
                />
              )}
            </div>
          )}
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
              disabled={out || Boolean(missing)}
              onClick={() => add(1)}
              className="sf-eyebrow h-11 flex-1 rounded-[2px] text-[var(--sf-accent-fg)] transition-colors disabled:opacity-40"
              style={{ background: "var(--sf-accent)" }}
            >
              {added ? "Added ✓" : missing ? `Choose ${missing.toLowerCase()}` : "Add to order"}
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

function OptionPicker({
  name,
  values,
  selected,
  onSelect,
  isOut,
}: {
  name: string;
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  isOut: (v: string) => boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend className="sf-eyebrow mb-2 text-muted">
        {name}
        {selected && <span className="ml-1.5 normal-case tracking-normal text-ink">· {selected}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = selected === v;
          const out = isOut(v);
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(v)}
              className={`min-h-10 min-w-11 rounded-[3px] border px-3 text-sm transition-colors ${
                on ? "" : "border-line bg-card text-ink hover:border-[var(--sf-accent)]"
              } ${out && !on ? "text-muted line-through opacity-60" : ""}`}
              style={
                on
                  ? {
                      background: "var(--sf-accent)",
                      borderColor: "var(--sf-accent)",
                      color: "var(--sf-accent-fg)",
                    }
                  : undefined
              }
            >
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
