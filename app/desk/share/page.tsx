import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireActive } from "@/lib/session";
import { recentShareCarts } from "@/lib/share";
import { PageHeader, Card, EmptyState, Table, Th, Td } from "@/components/desk/ui";
import { ShareSettingsForm } from "@/components/share/share-settings-form";
import { CopyLink } from "@/components/share/copy-link";

export default async function SharePage() {
  const ctx = await requireActive();
  const [tenant, carts, h] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, ctx.tenantId) }),
    recentShareCarts(ctx),
    headers(),
  ]);

  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = `${proto}://${host}/s/${ctx.tenantSlug}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });

  return (
    <>
      <PageHeader
        title="Share link"
        subtitle="A public, mobile-first catalog that hands off to WhatsApp"
        actions={
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Open storefront →
          </a>
        }
      />

      {tenant?.publicPagePaused && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          Your storefront is paused — visitors see a &ldquo;not taking orders&rdquo; message.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Settings">
            <ShareSettingsForm
              accentColor={tenant?.accentColor ?? null}
              sharePolicyText={tenant?.sharePolicyText ?? null}
              paused={tenant?.publicPagePaused ?? false}
            />
          </Card>
        </div>

        <Card title="Your link">
          <div className="flex flex-col gap-3">
            <CopyLink url={url} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="QR code for your storefront link"
              className="mx-auto size-40 rounded-lg border border-line"
            />
            <p className="text-center text-xs text-muted">
              Print the QR for your counter or business cards.
            </p>
          </div>
        </Card>
      </div>

      <Card title="Recent WhatsApp handoffs" bodyClassName="p-0">
        {carts.length === 0 ? (
          <div className="p-4">
            <EmptyState>
              No handoffs yet. When a customer taps &ldquo;Order on WhatsApp&rdquo;, their
              reference code shows up here — paste it into a new order to pull in the items.
            </EmptyState>
          </div>
        ) : (
          <Table>
            <thead className="border-b border-line bg-surface">
              <tr>
                <Th>Reference</Th>
                <Th>Customer</Th>
                <Th className="text-right">Subtotal</Th>
                <Th>Status</Th>
                <Th className="text-right">When</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {carts.map((c) => (
                <tr key={c.code}>
                  <Td className="font-mono text-xs font-semibold">{c.code}</Td>
                  <Td>{c.customerName ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{c.subtotal}</Td>
                  <Td>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        c.status === "imported" ? "text-accent" : "text-muted"
                      }`}
                    >
                      {c.status}
                    </span>
                  </Td>
                  <Td className="text-right text-xs text-muted">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
