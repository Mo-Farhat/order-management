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
      <nav className="mkt-nav pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2 text-white">
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
            className="rounded-full px-3 py-1.5 text-[13px] text-white/75 transition-colors hover:text-white"
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
          className="grid size-9 place-items-center rounded-full border border-white/20 text-white md:hidden"
        >
          <span className="text-base leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {open && (
        <div className="mkt-nav pointer-events-auto mx-auto mt-2 max-w-3xl rounded-2xl p-4 text-white md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-white/80 hover:bg-white/10"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="rounded-full border border-white/20 py-2 text-center text-[12px] uppercase tracking-[0.14em]"
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
      )}
    </div>
  );
}
