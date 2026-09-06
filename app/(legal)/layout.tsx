import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="border-b border-line bg-card px-5 py-3">
        <Link href="/" className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {APP_NAME}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <article className="prose-legal flex flex-col gap-4 text-sm leading-relaxed text-foreground [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
          {children}
        </article>
        <p className="mt-10 flex gap-4 border-t border-line pt-4 text-xs text-muted">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
