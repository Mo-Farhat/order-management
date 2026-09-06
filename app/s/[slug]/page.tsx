import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/share";
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
  searchParams: Promise<{ cart?: string }>;
}) {
  const { slug } = await params;
  const { cart } = await searchParams;
  const data = await getStorefront(slug);
  if (!data) notFound();

  if ("paused" in data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          We&apos;re not taking orders right now. Please check back soon.
        </p>
      </main>
    );
  }

  if (data.products.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">{data.tenant.name}</h1>
        <p className="mt-2 text-sm text-muted">Catalog coming soon.</p>
      </main>
    );
  }

  return <Storefront slug={slug} storefront={data} openCart={cart === "1"} />;
}
