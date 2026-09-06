"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function CatalogSearch({
  defaultQuery,
  categories,
  activeCategory,
  includeArchived,
}: {
  defaultQuery: string;
  categories: string[];
  activeCategory: string;
  includeArchived: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(defaultQuery);
  const [, startTransition] = useTransition();

  function push(next: URLSearchParams) {
    startTransition(() => router.replace(`/desk/catalog?${next.toString()}`));
  }

  function onSearch(value: string) {
    setQ(value);
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    push(next);
  }

  function toggleCategory(cat: string) {
    const next = new URLSearchParams(params);
    if (activeCategory === cat) next.delete("category");
    else next.set("category", cat);
    push(next);
  }

  function toggleArchived() {
    const next = new URLSearchParams(params);
    if (includeArchived) next.delete("archived");
    else next.set("archived", "1");
    push(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by name"
        className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
      />
      {/* Category chips only appear once there are 2+ categories (UX S1). */}
      {categories.length >= 2 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
                activeCategory === cat
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line text-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={toggleArchived}
        className="self-start text-xs text-muted underline underline-offset-4"
      >
        {includeArchived ? "Hide archived" : "Show archived"}
      </button>
    </div>
  );
}
