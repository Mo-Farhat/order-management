"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Prev / Next pager that preserves the current query string (filters, search).
 * `page` is 1-based. Renders nothing useful below 2 pages — caller decides
 * whether to show it.
 */
export function Pager({ page, pageCount }: { page: number; pageCount: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const href = (p: number) => {
    const clamped = Math.min(Math.max(p, 1), pageCount);
    const next = new URLSearchParams(sp.toString());
    if (clamped <= 1) next.delete("page");
    else next.set("page", String(clamped));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const btn =
    "inline-flex h-8 items-center rounded-md border border-line px-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-ink transition-colors hover:border-accent/50 aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={href(page - 1)} aria-disabled={page <= 1} className={btn}>
        ← Prev
      </Link>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Page {page} of {pageCount}
      </span>
      <Link href={href(page + 1)} aria-disabled={page >= pageCount} className={btn}>
        Next →
      </Link>
    </div>
  );
}
