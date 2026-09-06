import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontProduct } from "@/lib/share";
import { ProductDetail } from "@/components/share/product-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getStorefrontProduct(slug, id);
  if (!data) return { title: "Not found" };
  return {
    title: `${data.product.name} · ${data.tenant.name}`,
    description: data.product.description ?? `Order ${data.product.name} on WhatsApp.`,
  };
}

export default async function StorefrontProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const data = await getStorefrontProduct(slug, id);
  if (!data) notFound();
  return <ProductDetail slug={slug} data={data} />;
}
