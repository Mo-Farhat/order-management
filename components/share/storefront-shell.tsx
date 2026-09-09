import type { CSSProperties, ReactNode } from "react";
import type { StorefrontChrome } from "@/lib/share";
import { StorefrontNav } from "@/components/share/storefront-nav";
import { StorefrontFooter } from "@/components/share/storefront-footer";

/**
 * Wraps every `/s/{slug}` state with the shared nav + footer and sets the
 * per-shop theme variables in one place. Rendered from the route layout with
 * `chrome` from `getStorefrontChrome`.
 */
export function StorefrontShell({
  chrome,
  children,
}: {
  chrome: StorefrontChrome;
  children: ReactNode;
}) {
  const style = {
    "--sf-accent": chrome.accentColor,
    "--sf-accent-fg": chrome.accentFg,
    "--sf-secondary": chrome.config.secondaryColor || undefined,
  } as CSSProperties;

  const showNav = !chrome.paused;

  return (
    <div
      style={style}
      data-sf-font={chrome.config.font}
      data-sf-bg={chrome.config.bgTone}
      className="flex min-h-[100dvh] flex-col bg-background text-ink"
    >
      {showNav && (
        <StorefrontNav
          slug={chrome.slug}
          name={chrome.name}
          logoUrl={chrome.logoUrl}
          categories={chrome.config.sections.categoryNav === false ? [] : chrome.categories}
        />
      )}
      <div className="flex flex-1 flex-col">{children}</div>
      <StorefrontFooter chrome={chrome} />
    </div>
  );
}
