"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportCodeBox({ defaultCode = "" }: { defaultCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(defaultCode);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim().toUpperCase();
        if (c) router.push(`/desk/orders/new?code=${encodeURIComponent(c)}`);
      }}
      className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
        WhatsApp code
      </span>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. K7M2QP"
        className="h-8 w-28 rounded border border-line bg-card px-2 font-mono text-sm uppercase outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="rounded border border-line px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50"
      >
        Load
      </button>
    </form>
  );
}
