"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function OrderSearch({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(defaultQuery);
  const [, start] = useTransition();

  function onChange(value: string) {
    setQ(value);
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    start(() => router.replace(`/desk?${next.toString()}`));
  }

  return (
    <input
      value={q}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search name, phone, or #number"
      className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
    />
  );
}
