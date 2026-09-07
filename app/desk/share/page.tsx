import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { pendingStorefrontOrders } from "@/lib/share";
import { distinctCategories } from "@/lib/catalog";
import { PageHeader, Card, EmptyState } from "@/components/desk/ui";
import { ShareSettingsForm } from "@/components/share/share-settings-form";
import { CopyLink } from "@/components/share/copy-link";

export default async function SharePage() {
  const ctx = await requireActive();
  const [tenant, pending, allCategories, h] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    pendingStorefrontOrders(ctx),
    distinctCategories(ctx),
    headers(),
  ]);

  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const slug = tenant?.slug ?? ctx.tenantSlug;
  const url = `${proto}://${host}/s/${slug}`;
  const currency = tenant?.currency ?? "";

  let qrSvg: string | null = null;
  try {
    qrSvg = await QRCode.toString(url, { type: "svg", margin: 1 });
  } catch {
    qrSvg = null;
  }

  return (
    <>
      <PageHeader
        title="Storefront"
        subtitle="A mini storefront — customers browse and send their order straight to your DMs"
        actions={
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
            Open storefront →
          </a>
        }
      />

      {tenant?.publicPagePaused && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          Your storefront is paused — visitors see a &ldquo;not taking orders&rdquo; message.
        </p>
      )}

      {pending.length > 0 && (
        <Card title={`${pending.length} storefront order${pending.length === 1 ? "" : "s"} to review`}>
          <ul className="flex flex-col divide-y divide-line text-sm">
            {pending.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/desk/orders/${o.id}`} className="hover:underline">
                  <span className="font-mono text-xs text-accent">#{o.orderNumber}</span>{" "}
                  {o.customerName} · {currency} {o.total}
                </Link>
                <span className="text-xs text-muted">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Open one to <strong>Accept</strong> (turns it into a confirmed order) or Decline.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Settings">
            <ShareSettingsForm
              whatsappNumber={tenant?.whatsappNumber ?? ""}
              instagramHandle={tenant?.instagramHandle ?? ""}
              allCategories={allCategories}
              chosenCategories={tenant?.storefrontCategories ?? null}
              accentColor={tenant?.accentColor ?? null}
              sharePolicyText={tenant?.sharePolicyText ?? null}
              paused={tenant?.publicPagePaused ?? false}
            />
          </Card>
        </div>

        <Card title="Your link">
          <div className="flex flex-col gap-3">
            <CopyLink url={url} />
            {qrSvg && (
              <div
                className="mx-auto size-40 rounded-lg border border-line [&>svg]:size-full"
                aria-label="QR code for your storefront link"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <p className="text-center text-xs text-muted">
              Print the QR for your counter or business cards.
            </p>
          </div>
        </Card>
      </div>

      <Card title="How it works">
        <EmptyState>
          Customers open your link, pick items, enter their details, and tap{" "}
          <strong>Send on WhatsApp</strong> or <strong>Send on Instagram</strong>. The order
          lands here as <strong>Pending</strong> — you Accept or Decline it.
        </EmptyState>
      </Card>
    </>
  );
}
