import type { OrderStatus } from "@/db/schema";

// Icon + label so status is legible without relying on colour (UX 03 note).
const META: Record<OrderStatus, { label: string; icon: string; tone: string }> = {
  draft: { label: "Draft", icon: "✎", tone: "border-line text-muted" },
  confirmed: { label: "Confirmed", icon: "●", tone: "border-ink text-ink" },
  packed: { label: "Packed", icon: "▣", tone: "border-ink text-ink" },
  shipped: { label: "Shipped", icon: "➜", tone: "border-ink text-ink" },
  delivered: { label: "Delivered", icon: "✓", tone: "border-ink bg-lime/40 text-ink" },
  cancelled: { label: "Cancelled", icon: "✕", tone: "border-danger/50 text-danger" },
  returned: { label: "Returned", icon: "↩", tone: "border-danger/50 text-danger" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${m.tone}`}
    >
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}

export function relativeTime(date: Date): string {
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
