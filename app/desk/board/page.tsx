import Link from "next/link";
import { requireActive } from "@/lib/session";
import { listOrders } from "@/lib/orders";
import { can } from "@/lib/rbac";
import type { OrderStatus } from "@/db/schema";
import { AdvanceButton } from "@/components/orders/advance-button";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

export default async function BoardPage() {
  const ctx = await requireActive();
  const rows = await listOrders(ctx, {
    statuses: COLUMNS.map((c) => c.status),
  });
  const mayAdvance = can(ctx.role, "order:advance");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Board</h2>
        <Link href="/desk" className="text-xs text-muted underline underline-offset-4">
          List view →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cards = rows.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="flex w-56 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
                <span>{col.label}</span>
                <span>{cards.length}</span>
              </div>
              {cards.length === 0 && (
                <p className="rounded-lg border border-dashed border-line p-3 text-xs text-muted">
                  Empty
                </p>
              )}
              {cards.map((c) => (
                <div key={c.id} className="rounded-lg border border-line bg-surface p-2 text-sm">
                  <Link href={`/desk/orders/${c.id}`} className="block font-medium hover:underline">
                    #{c.orderNumber} {c.customerName}
                  </Link>
                  <p className="text-xs text-muted">{c.itemCount} items</p>
                  {mayAdvance && col.status !== "delivered" && (
                    <AdvanceButton orderId={c.id} />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
