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
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-accent text-sm text-accent-fg">
            {APP_NAME.charAt(0)}
          </span>
          {APP_NAME}
        </Link>

        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="hover:text-ink">
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg hover:bg-accent/90"
          >
            Start free
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-md border border-line md:hidden"
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-background px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="text-muted">
                {label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-line font-mono text-[11px] font-semibold uppercase tracking-widest"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-accent font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
