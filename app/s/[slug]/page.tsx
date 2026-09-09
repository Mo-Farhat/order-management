import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/share";
import { SORT_KEYS, type SortKey } from "@/lib/validation";
import { Storefront } from "@/components/share/storefront";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefront(slug);
  const name = data && "tenant" in data ? data.tenant.name : data && "name" in data ? data.name : "Storefront";
  return { title: name, description: `Order from ${name} on WhatsApp.` };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cart?: string; category?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { cart, category, sort } = await searchParams;
  const sortKey: SortKey | undefined =
    sort && (SORT_KEYS as string[]).includes(sort) ? (sort as SortKey) : undefined;

  const data = await getStorefront(slug, { category: category || undefined, sort: sortKey });
  if (!data) notFound();

  if ("paused" in data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="max-w-sm text-sm text-muted">
          We&apos;re not taking orders right now. Please check back soon.
        </p>
      </main>
    );
  }

  return (
    <Storefront
      slug={slug}
      storefront={data}
      openCart={cart === "1"}
      category={category || ""}
      sort={sortKey ?? null}
    />
  );
}
