"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const LINKS = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none sticky top-3 z-50 px-3">
     <div className="relative mx-auto max-w-3xl">
      <nav className="mkt-nav pointer-events-auto flex items-center justify-between gap-3 rounded-lg py-2 pl-4 pr-2 text-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-fg">
            {APP_NAME.charAt(0)}
          </span>
          <span className="mkt-serif text-lg">{APP_NAME}</span>
        </Link>

        <div className="hidden items-center gap-6 text-[13px] text-white/75 md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-[13px] text-white/75 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="mkt-btn mkt-btn-light px-4 py-1.5 text-[12px] uppercase tracking-[0.14em]"
          >
            Start free
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-md border border-white/20 text-white md:hidden"
        >
          <span className="text-base leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* mobile dropdown — absolutely positioned so opening it never changes
          layout height (no white strip) and it can transition smoothly */}
      <div
        aria-hidden={!open}
        className={`mkt-nav absolute inset-x-0 top-[calc(100%+0.5rem)] origin-top rounded-lg p-4 text-white transition-[opacity,transform] duration-300 ease-out md:hidden ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.97] opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 text-sm">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-white/80 transition-colors hover:bg-white/10"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="rounded-md border border-white/20 py-2 text-center text-[12px] uppercase tracking-[0.14em]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="mkt-btn mkt-btn-light py-2 text-center text-[12px] uppercase tracking-[0.14em]"
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}
