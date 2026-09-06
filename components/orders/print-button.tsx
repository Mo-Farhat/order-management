"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
    >
      Print / Save PDF
    </button>
  );
}
