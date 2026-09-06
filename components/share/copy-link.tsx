"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 text-xs">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the URL is visible to select manually */
          }
        }}
        className="shrink-0 rounded-lg border border-line px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest hover:border-accent/50"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
