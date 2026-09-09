import { notFound } from "next/navigation";
import { getStorefrontChrome } from "@/lib/share";
import { StorefrontShell } from "@/components/share/storefront-shell";

/**
 * Customer-facing storefront gets the "B2B Trust Blue" palette (scoped by
 * `.sf-theme`) plus the shop's own accent / font / tone, applied once here so
 * every state below — catalog, product, paused, empty, error — is wrapped in
 * the same nav + footer chrome.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chrome = await getStorefrontChrome(slug);
  if (!chrome) notFound();

  return (
    <div className="sf-theme">
      <StorefrontShell chrome={chrome}>{children}</StorefrontShell>
    </div>
  );
}
