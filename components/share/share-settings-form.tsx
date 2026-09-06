"use client";

import { useActionState, useState } from "react";
import { saveShareSettings } from "@/app/actions/share";
import { FormError } from "@/components/form";
import { Btn } from "@/components/desk/ui";

export function ShareSettingsForm({
  whatsappNumber,
  instagramHandle,
  accentColor,
  sharePolicyText,
  paused,
  allCategories,
  chosenCategories,
}: {
  whatsappNumber: string;
  instagramHandle: string;
  accentColor: string | null;
  sharePolicyText: string | null;
  paused: boolean;
  allCategories: string[];
  chosenCategories: string[] | null;
}) {
  const [state, action] = useActionState(saveShareSettings, undefined);
  const [color, setColor] = useState(accentColor || "#0f7b6c");

  // ordered list of shown chips; unshown = allCategories not in `order`.
  // null = never configured → default to all; [] = deliberately none.
  const [order, setOrder] = useState<string[]>(
    chosenCategories === null
      ? allCategories
      : chosenCategories.filter((c) => allCategories.includes(c)),
  );
  const unused = allCategories.filter((c) => !order.includes(c));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      {state?.ok && <p className="text-xs text-accent">{state.ok}</p>}

      <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3">
        <span className="text-sm">
          <span className="font-medium">Page is live</span>
          <span className="block text-xs text-muted">
            Turn off to show visitors a &ldquo;not taking orders&rdquo; message.
          </span>
        </span>
        <input
          type="checkbox"
          name="paused"
          defaultChecked={paused}
          className="size-5 accent-[var(--color-danger)]"
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">paused</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          WhatsApp number
        </span>
        <input
          name="whatsappNumber"
          defaultValue={whatsappNumber}
          inputMode="tel"
          placeholder="+94771234567"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent sm:w-56"
        />
        <span className="text-xs text-muted">Storefront orders are sent here.</span>
        {state?.fieldErrors?.whatsappNumber?.map((m) => (
          <span key={m} className="text-xs text-danger">{m}</span>
        ))}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Instagram handle
        </span>
        <input
          name="instagramHandle"
          defaultValue={instagramHandle}
          placeholder="yourshop"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent sm:w-56"
        />
        <span className="text-xs text-muted">
          Adds a &ldquo;Send on Instagram&rdquo; button. Set at least one of WhatsApp or Instagram.
        </span>
        {state?.fieldErrors?.instagramHandle?.map((m) => (
          <span key={m} className="text-xs text-danger">{m}</span>
        ))}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Accent colour
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 rounded-lg border border-line bg-surface"
          />
          <input
            name="accentColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-32 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
          />
        </div>
        {state?.fieldErrors?.accentColor?.map((m) => (
          <span key={m} className="text-xs text-danger">{m}</span>
        ))}
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Category chips
        </span>
        <span className="text-xs text-muted">
          The filter buttons at the top of your storefront, in this order. Names must match a
          product&apos;s category.
        </span>
        <input type="hidden" name="storefrontCategories" value={JSON.stringify(order)} />
        {allCategories.length === 0 ? (
          <p className="text-xs text-muted">Add a category to a product first.</p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {order.map((c, i) => (
                <li key={c} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="flex-1">{c}</span>
                  <button type="button" onClick={() => move(i, -1)} className="size-6 rounded border border-line text-xs disabled:opacity-30" disabled={i === 0}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="size-6 rounded border border-line text-xs disabled:opacity-30" disabled={i === order.length - 1}>↓</button>
                  <button type="button" onClick={() => setOrder(order.filter((x) => x !== c))} className="text-xs text-danger">remove</button>
                </li>
              ))}
              {order.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted">No chips — the storefront shows every category.</li>
              )}
            </ul>
            {unused.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {unused.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOrder([...order, c])}
                    className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-accent/50"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Delivery / policy note
        </span>
        <textarea
          name="sharePolicyText"
          defaultValue={sharePolicyText ?? ""}
          rows={3}
          maxLength={500}
          placeholder="e.g. Colombo delivery within 2 days. Cash or bank transfer."
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <Btn type="submit" className="self-start">Save settings</Btn>
    </form>
  );
}
