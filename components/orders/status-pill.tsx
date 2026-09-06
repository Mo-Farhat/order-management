import type { OrderStatus, DeliveryStatus, PaymentStatus } from "@/db/schema";

const ORDER: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "border-line text-muted" },
  confirmed: { label: "Confirmed", tone: "border-accent/40 text-ink" },
  packed: { label: "Confirmed", tone: "border-accent/40 text-ink" },
  shipped: { label: "Confirmed", tone: "border-accent/40 text-ink" },
  delivered: { label: "Completed", tone: "border-ok/40 bg-ok/10 text-ok" },
  completed: { label: "Completed", tone: "border-ok/40 bg-ok/10 text-ok" },
  cancelled: { label: "Cancelled", tone: "border-danger/40 text-danger" },
  returned: { label: "Returned", tone: "border-danger/40 text-danger" },
};

const DELIVERY: Record<DeliveryStatus, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "border-line text-muted" },
  dispatched: { label: "Dispatched", tone: "border-warn/50 text-warn" },
  delivered: { label: "Delivered", tone: "border-ok/40 bg-ok/10 text-ok" },
};

const PAYMENT: Record<PaymentStatus, { label: string; tone: string }> = {
  unpaid: { label: "Unpaid", tone: "border-line text-muted" },
  partial: { label: "Partial", tone: "border-warn/50 text-warn" },
  paid: { label: "Paid", tone: "border-ok/40 bg-ok/10 text-ok" },
};

function Pill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = ORDER[status] ?? ORDER.confirmed;
  return <Pill label={m.label} tone={m.tone} />;
}

export function DeliveryPill({ status }: { status: DeliveryStatus }) {
  const m = DELIVERY[status];
  return <Pill label={m.label} tone={m.tone} />;
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const m = PAYMENT[status];
  return <Pill label={m.label} tone={m.tone} />;
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
