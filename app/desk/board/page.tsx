import Link from "next/link";
import { requireActive } from "@/lib/session";
import { listOrders } from "@/lib/orders";
import { can } from "@/lib/rbac";
import type { OrderStatus } from "@/db/schema";
import { AdvanceButton } from "@/components/orders/advance-button";
import { PageHeader } from "@/components/desk/ui";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

export default async function BoardPage() {
  const ctx = await requireActive();
  const rows = await listOrders(ctx, { statuses: COLUMNS.map((c) => c.status) });
  const mayAdvance = can(ctx.role, "order:advance");

  return (
    <>
      <PageHeader
        title="Pipeline board"
        subtitle="Drag-free — advance orders one stage at a time"
        actions={
          <Link href="/desk/orders" className="text-xs text-accent hover:underline">
            List view →
          </Link>
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cards = rows.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="flex w-60 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
                <span>{col.label}</span>
                <span className="tabular-nums">{cards.length}</span>
              </div>
              {cards.length === 0 && (
                <p className="rounded-lg border border-dashed border-line p-3 text-xs text-muted">
                  Empty
                </p>
              )}
              {cards.map((c) => (
                <div key={c.id} className="rounded-lg border border-line bg-card p-3 text-sm shadow-[0_1px_2px_rgba(20,32,29,0.04)]">
                  <Link href={`/desk/orders/${c.id}`} className="block font-medium hover:underline">
                    <span className="font-mono text-xs text-accent">#{c.orderNumber}</span> {c.customerName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{c.itemCount} items</p>
                  {mayAdvance && col.status !== "delivered" && <AdvanceButton orderId={c.id} />}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
