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
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={`/s/${slug}`} className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-9 rounded-lg object-cover" />
          ) : (
            <span
              className="flex size-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-fg)" }}
            >
              {name.charAt(0)}
            </span>
          )}
          <span className="text-base font-semibold">{name}</span>
        </Link>

        <Link
          href={`/s/${slug}?cart=1`}
          className="ml-auto relative flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium"
        >
          Order
          {count > 0 && (
            <span
              className="flex min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-fg)" }}
            >
              {count}
            </span>
          )}
        </Link>
      </div>

      {categories.length > 0 && (
        <nav className="mx-auto flex w-full max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2">
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
      className={`whitespace-nowrap rounded-md border px-3 py-1 text-xs transition-colors ${
        active ? "text-[var(--sf-accent-fg)]" : "border-line text-muted"
      }`}
      style={active ? { background: "var(--sf-accent)", borderColor: "var(--sf-accent)" } : undefined}
    >
      {children}
    </Link>
  );
}
