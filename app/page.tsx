import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { APP_NAME } from "@/lib/constants";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.tenantId ? "/desk" : "/onboarding/business");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {APP_NAME}
        </p>
        <h1 className="mt-4 text-3xl font-medium leading-tight tracking-tight">
          Your orders stop living in your DMs.
        </h1>
        <p className="mt-3 text-muted">
          A catalog and an order pipeline you run from your phone, one-handed,
          mid-conversation with a customer.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 font-mono text-xs font-semibold uppercase tracking-widest text-accent-fg"
          >
            Start free — no card needed
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md border border-line px-6 font-mono text-xs font-semibold uppercase tracking-widest"
          >
            Log in
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted">
          14 days free. No card until you decide to keep it.
        </p>

        <p className="mt-8 flex gap-4 text-xs text-muted">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
