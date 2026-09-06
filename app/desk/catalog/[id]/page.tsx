import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActive } from "@/lib/session";
import { getProduct } from "@/lib/catalog";
import { isStorageConfigured } from "@/lib/storage";
import { can } from "@/lib/rbac";
import { updateProductAction } from "@/app/actions/catalog";
import { ProductForm } from "@/components/catalog/product-form";
import { ProductDangerZone } from "@/components/catalog/product-danger-zone";

const REASON_LABEL: Record<string, string> = {
  initial: "Initial stock",
  manual_adjustment: "Manual adjustment",
  import: "CSV import",
  order_confirmed: "Order confirmed",
  order_cancelled: "Order cancelled",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireActive();
  const { id } = await params;
  const data = await getProduct(ctx, id);
  if (!data) notFound();

  const { product, photos, movements, hasOrderHistory } = data;
  const boundUpdate = updateProductAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/desk/catalog"
        className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted"
      >
        ← Catalog
      </Link>
      <h2 className="text-base font-medium">{product.name}</h2>

      <ProductForm
        action={boundUpdate}
        submitLabel="Save changes"
        storageEnabled={isStorageConfigured()}
        photos={photos.map((p) => ({ id: p.id, url: p.url }))}
        defaults={{
          name: product.name,
          price: product.price,
          stockQty: product.stockQty,
          description: product.description,
          category: product.category,
          lowStockThreshold: product.lowStockThreshold,
          sku: product.sku,
          storefrontHidden: product.storefrontHidden,
        }}
      />

      <section className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Stock history
        </span>
        {movements.length === 0 ? (
          <p className="text-xs text-muted">No movements yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line text-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-muted">
                  {new Date(m.createdAt).toLocaleString()} · {REASON_LABEL[m.reason] ?? m.reason}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
                <span className="font-mono">
                  {m.delta > 0 ? `+${m.delta}` : m.delta} → {m.balanceAfter}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductDangerZone
        productId={id}
        archived={Boolean(product.archivedAt)}
        canDelete={can(ctx.role, "catalog:delete_product")}
        canHardDelete={!hasOrderHistory}
      />
    </div>
  );
}
