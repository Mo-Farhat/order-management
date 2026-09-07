"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_NAME, PLAN_PRICE_LKR } from "@/lib/constants";

const fmt = (n: number) => n.toLocaleString("en-US");

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  // Two months free on annual.
  const monthly = PLAN_PRICE_LKR;
  const shown = annual ? Math.round((monthly * 10) / 12) : monthly;

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

      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {/* Starter — the live plan */}
        <div className="mkt-card flex flex-col rounded-2xl border-2 border-accent bg-card p-6 shadow-[0_2px_24px_rgba(30,64,175,0.12)]">
          <p className="mkt-eyebrow mkt-amber text-[11px]">Starter</p>
          <p className="mkt-serif mt-3 text-4xl">
            LKR {fmt(shown)}
            <span className="text-base font-normal text-muted">/mo</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {annual ? `Billed LKR ${fmt(shown * 12)} yearly` : "Billed monthly"} · 14-day free
            trial, no card
          </p>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm">
            {[
              "Your mini storefront (Instagram + WhatsApp)",
              "Unlimited products & orders",
              "Order, delivery & payment tracking",
              "Customer list & CSV exports",
              "One owner login",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-ok">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mkt-btn mkt-btn-primary mt-6 h-11 px-5 text-[11px] uppercase tracking-[0.16em]"
          >
            Start free
          </Link>
        </div>

        {/* Growth — coming soon */}
        <div className="flex flex-col rounded-2xl border border-line bg-surface/60 p-6">
          <p className="mkt-eyebrow text-[11px] text-muted">Growth · coming soon</p>
          <p className="mkt-serif mt-3 text-4xl text-muted">Later</p>
          <p className="mt-1 text-xs text-muted">For shops that outgrow Starter.</p>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
            {[
              "Everything in Starter",
              "Staff logins & roles",
              "Multiple WhatsApp / IG accounts",
              "Advanced reports & analytics",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span>•</span>
                {f}
              </li>
            ))}
          </ul>
          <span className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Not yet available
          </span>
        </div>
      </div>

      <p
        className="max-w-xl rounded-xl border px-4 py-3 text-center text-sm"
        style={{ borderColor: "var(--amber)", background: "var(--amber-weak)" }}
      >
        <strong>Running your storefront on {APP_NAME}?</strong> You get <strong>20% off</strong>{" "}
        when we build your full website — your catalog and branding carry straight over.
      </p>
    </div>
  );
}
