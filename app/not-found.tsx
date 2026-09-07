import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        {APP_NAME}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-2 flex gap-2">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg"
        >
          Go home
        </Link>
        <Link
          href="/desk"
          className="inline-flex h-10 items-center rounded-md border border-line px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink"
        >
          Open the desk
        </Link>
      </div>
    </main>
  );
}
