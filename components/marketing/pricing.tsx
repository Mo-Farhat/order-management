"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { TIERS } from "@/lib/tiers";

const fmt = (n: number) => n.toLocaleString("en-US");

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  // Two months free on annual.
  const factor = (n: number) => (annual ? Math.round((n * 10) / 12) : n);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="inline-flex rounded-md border border-line bg-card p-1 text-sm">
        <button
          onClick={() => setAnnual(false)}
          className={`rounded px-4 py-1.5 font-medium transition-all duration-300 ${
            !annual ? "bg-accent text-accent-fg shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`rounded px-4 py-1.5 font-medium transition-all duration-300 ${
            annual ? "bg-accent text-accent-fg shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          Annual <span className="text-xs opacity-80">· 2 months free</span>
        </button>
      </div>

      <div className="grid w-full max-w-5xl gap-5 sm:grid-cols-3">
        {TIERS.map((t, i) => {
          const live = t.priceLKR !== null;
          const shown = live ? factor(t.priceLKR!) : null;
          return (
            <div
              key={t.key}
              className={`mkt-card flex flex-col rounded-2xl border bg-card p-6 ${
                i === 0
                  ? "border-2 border-accent shadow-[0_2px_24px_rgba(30,64,175,0.12)]"
                  : "border-line bg-surface/50"
              }`}
            >
              <p className={`mkt-eyebrow text-[11px] ${i === 0 ? "mkt-amber" : "text-muted"}`}>
                {t.name}
              </p>
              <p className={`mkt-serif mt-3 text-4xl ${live ? "" : "text-muted"}`}>
                {live ? (
                  <>
                    LKR {fmt(shown!)}
                    <span className="text-base font-normal text-muted">/mo</span>
                  </>
                ) : (
                  "Coming soon"
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                {live
                  ? `${annual ? `Billed LKR ${fmt(shown! * 12)} yearly` : "Billed monthly"} · 14-day free trial, no card`
                  : t.tagline}
              </p>
              <ul className="mt-5 flex flex-col gap-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className={`flex gap-2 ${live ? "" : "text-muted"}`}>
                    <span className={live ? "text-ok" : ""}>{live ? "✓" : "•"}</span>
                    {f}
                  </li>
                ))}
              </ul>
              {live ? (
                <Link
                  href="/signup"
                  className="mkt-btn mkt-btn-primary mt-6 h-11 px-5 text-[11px] uppercase tracking-[0.16em]"
                >
                  Start free
                </Link>
              ) : (
                <span className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                  Not yet available
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p
        className="max-w-xl rounded-xl border px-4 py-3 text-center text-sm"
        style={{ borderColor: "var(--amber)", background: "var(--amber-weak)" }}
      >
        <strong>On the Pro tier?</strong> You get <strong>20% off</strong> when we build your
        full website on {APP_NAME} — your catalog and branding carry straight over.
      </p>
    </div>
  );
}
