import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const DEFAULT_POINTS = [
  "A branded storefront your customers order from — not a Google Form",
  "Every order tracked from pending to delivered and paid",
  "WhatsApp and Instagram handoff built in",
];

/**
 * Shared split-screen chrome for the signed-out flow (login / signup / reset)
 * and onboarding. Deep-blue brand panel on the left (≥ lg), the form in a card
 * on a pale cloud wash on the right. Scoped to `.mkt` so it uses the
 * customer-facing palette and fonts.
 */
export function AuthShell({
  children,
  headline,
  points = DEFAULT_POINTS,
  cardWidth = "max-w-[420px]",
}: {
  children: React.ReactNode;
  headline?: React.ReactNode;
  points?: string[];
  cardWidth?: string;
}) {
  return (
    <div className="mkt flex min-h-[100dvh] flex-col lg:flex-row">
      <aside className="mkt-auth-aside relative hidden w-[42%] max-w-lg flex-col justify-between p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-white/15 text-sm font-bold">
            {APP_NAME.charAt(0)}
          </span>
          <span className="mkt-serif text-xl">{APP_NAME}</span>
        </Link>

        <div>
          <h2 className="mkt-serif text-[2rem] leading-[1.1] text-white">
            {headline ?? (
              <>
                Take the order.
                <br />
                <span className="text-white/70">Skip the chaos.</span>
              </>
            )}
          </h2>
          <ul className="mt-8 flex flex-col gap-3.5 text-sm text-white/85">
            {points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span aria-hidden className="mt-px text-white/60">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/55">
          © {new Date().getFullYear()} {APP_NAME} · Made for sellers in Sri Lanka
        </p>
      </aside>

      <main className="mkt-auth-bg flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8 lg:py-10">
        <div className={`w-full ${cardWidth}`}>
          <Link
            href="/"
            className="mb-6 flex items-center gap-2 lg:hidden"
            aria-label={`${APP_NAME} home`}
          >
            <span className="grid size-7 place-items-center rounded-md bg-accent text-sm font-bold text-accent-fg">
              {APP_NAME.charAt(0)}
            </span>
            <span className="mkt-serif text-lg text-ink">{APP_NAME}</span>
          </Link>

          <div className="rounded-2xl border border-line bg-card p-7 shadow-[0_24px_60px_-30px_rgba(15,30,90,0.35)] sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
