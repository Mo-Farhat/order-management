import type { ReactNode } from "react";

/**
 * Customer-facing storefront gets the "B2B Trust Blue" palette (cool neutral,
 * blue primary) — scoped here so the desk app keeps its own tokens. The
 * per-tenant accent (`--sf-accent`) still overrides on top of this.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <div className="sf-theme flex min-h-[100dvh] flex-col">{children}</div>;
}
