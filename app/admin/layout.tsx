import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requirePlatformAdmin();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-card px-4 py-3 sm:px-6">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
            {APP_NAME} · Platform admin
          </p>
          <p className="text-xs text-muted">{email}</p>
        </div>
        <Link href="/desk" className="text-xs text-accent hover:underline">
          Back to shop →
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
