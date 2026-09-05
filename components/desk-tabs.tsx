"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/desk", label: "Orders", match: (p: string) => p === "/desk" },
  { href: "/desk/catalog", label: "Catalog", match: (p: string) => p.startsWith("/desk/catalog") },
  { href: "/desk/share", label: "Share", match: (p: string) => p.startsWith("/desk/share") },
];

export function DeskTabs() {
  const pathname = usePathname();
  return (
    <nav className="mt-4 flex gap-1 border-b border-line px-3">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest ${
              active ? "border-ink text-ink" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
