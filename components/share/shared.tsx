"use client";

import type { ReactNode } from "react";

export function Step({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-[3px] border border-line text-sm"
    >
      {children}
    </button>
  );
}

export function Placeholder() {
  return (
    <div className="flex size-full items-center justify-center bg-surface font-mono text-[10px] text-muted">
      no photo
    </div>
  );
}
