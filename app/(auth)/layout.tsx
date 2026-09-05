import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block font-mono text-xs font-semibold uppercase tracking-widest text-muted"
        >
          {APP_NAME}
        </Link>
        {children}
      </div>
    </main>
  );
}
