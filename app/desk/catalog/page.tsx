import Link from "next/link";
import { requireActive } from "@/lib/session";
import { distinctCategories, listProducts } from "@/lib/catalog";
import { isStorageConfigured } from "@/lib/storage";
import { StockEditor } from "@/components/catalog/stock-editor";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { PageHeader, Card, BtnLink, EmptyState, Table, Th, Td } from "@/components/desk/ui";

type SearchParams = { q?: string; category?: string; imported?: string; archived?: string };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const ctx = await requireActive();
  const sp = await searchParams;
  const includeArchived = sp.archived === "1";

  const [items, categories] = await Promise.all([
    listProducts(ctx, { search: sp.q, category: sp.category, includeArchived }),
    distinctCategories(ctx),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${items.length} shown`}
        actions={
          <>
            <BtnLink href="/desk/catalog/import" variant="outline">Import</BtnLink>
            <BtnLink href="/desk/catalog/new">+ Add product</BtnLink>
          </>
        }
      />

      {sp.imported && (
        <p className="rounded-lg border border-accent/30 bg-accent-weak px-3 py-2 text-sm">
          Imported {sp.imported} product{sp.imported === "1" ? "" : "s"}.
        </p>
      )}
      {!isStorageConfigured() && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          Photo uploads are off until Cloudflare R2 is configured (GUIDE.md step 4a).
          Products save fine without photos.
        </p>
      )}

      <CatalogSearch
        defaultQuery={sp.q ?? ""}
        categories={categories}
        activeCategory={sp.category ?? ""}
        includeArchived={includeArchived}
      />

      <Card bodyClassName="p-0">
        {items.length === 0 ? (
          <div className="p-4">
            {sp.q || sp.category ? (
              <EmptyState>Nothing matches that.</EmptyState>
            ) : (
              <EmptyState
                title="No products yet"
                action={<BtnLink href="/desk/catalog/new">Add your first product</BtnLink>}
              >
                Add what you sell — name, price, and a photo. Products show up on your
                storefront and in the new-order screen.
              </EmptyState>
            )}
          </div>
        ) : (
          <Table>
            <thead className="border-b border-line bg-surface">
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center font-mono text-[9px] text-muted">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/desk/catalog/${p.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          {p.archivedAt && (
                            <span className="font-mono text-[10px] uppercase text-muted">archived</span>
                          )}
                          {p.storefrontHidden && !p.archivedAt && (
                            <span className="font-mono text-[10px] uppercase text-muted">storefront-hidden</span>
                          )}
                          {p.isLowStock && (
                            <span className="rounded bg-warn/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warn">
                              low stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">{p.category ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{p.price}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end">
                      <StockEditor productId={p.id} stockQty={p.stockQty} />
                    </div>
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
