import Link from "next/link";
import { requireActive } from "@/lib/session";

const STEPS = [
  { label: "Add a product", href: "/desk/catalog/new", done: false },
  { label: "Take an order", href: "/desk", done: false },
  { label: "Share your link", href: "/desk/share", done: false },
];

export default async function OrdersPage() {
  await requireActive();

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        {STEPS.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3 px-4 py-3">
            <span
              className="flex size-6 items-center justify-center rounded-full border border-line font-mono text-[11px]"
              aria-hidden
            >
              {i + 1}
            </span>
            <Link href={step.href} className="text-sm underline-offset-4 hover:underline">
              {step.label}
            </Link>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
        The order desk (create order, pipeline, order detail) is Phase 3. For now,
        build out your <Link href="/desk/catalog" className="text-ink underline">catalog</Link>.
      </div>
    </div>
  );
}
