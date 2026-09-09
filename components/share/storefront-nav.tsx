"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStorefrontCart } from "@/components/share/use-cart";

/**
 * Sticky storefront header: logo + name (home link), URL-addressable category
 * links, and a cart button that routes to `?cart=1` (the catalog page opens the
 * sheet from that param). Live item count stays in sync via the cart hook.
 */
export function StorefrontNav({
  slug,
  name,
  logoUrl,
  categories,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
  categories: string[];
}) {
  const params = useSearchParams();
  const active = params.get("category") ?? "";
  const { count } = useStorefrontCart(slug);

  const catHref = (c: string) =>
    c ? `/s/${slug}?category=${encodeURIComponent(c)}` : `/s/${slug}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3.5">
        <Link href={`/s/${slug}`} className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-8 rounded-[2px] object-cover" />
          ) : (
            <span
              className="flex size-8 items-center justify-center rounded-[2px] text-sm font-bold"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-fg)" }}
            >
              {name.charAt(0)}
            </span>
          )}
          <span className="text-[15px] font-semibold tracking-tight">{name}</span>
        </Link>

        <Link
          href={`/s/${slug}?cart=1`}
          className="sf-eyebrow ml-auto flex h-9 text-ink items-center gap-2 rounded-[2px] border border-line px-3 text-ink"
        >
          Order
          {count > 0 && (
            <span
              className="min-w-4 text-center text-[11px] font-semibold tabular-nums"
              style={{ color: "var(--sf-accent)" }}
            >
              {count}
            </span>
          )}
        </Link>
      </div>

      {categories.length > 0 && (
        <nav className="mx-auto flex w-full max-w-6xl gap-5 overflow-x-auto border-t border-line px-4">
          <CatLink href={catHref("")} active={active === ""}>
            All
          </CatLink>
          {categories.map((c) => (
            <CatLink key={c} href={catHref(c)} active={active === c}>
              {c}
            </CatLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function CatLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className="sf-eyebrow -mb-px whitespace-nowrap text-muted border-b-2 py-2.5 transition-colors"
      style={{
        color: active ? "var(--sf-accent)" : undefined,
        borderColor: active ? "var(--sf-accent)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
