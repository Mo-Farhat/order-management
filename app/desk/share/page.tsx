import { requireActive } from "@/lib/session";

export default async function SharePage() {
  await requireActive();
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
      The public share link and its settings (logo, accent colour, QR code,
      pause toggle) are Phase 4.
    </div>
  );
}
