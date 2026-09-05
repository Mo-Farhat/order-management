import Link from "next/link";
import { requireActive } from "@/lib/session";
import { distinctCategories, listProducts } from "@/lib/catalog";
import { isStorageConfigured } from "@/lib/storage";
import { StockEditor } from "@/components/catalog/stock-editor";
import { CatalogSearch } from "@/components/catalog/catalog-search";

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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Catalog</h2>
        <div className="flex gap-2">
          <Link
            href="/desk/catalog/import"
            className="inline-flex h-9 items-center rounded-full border border-line px-4 font-mono text-[11px] font-semibold uppercase tracking-widest"
          >
            Import
          </Link>
          <Link
            href="/desk/catalog/new"
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-paper"
          >
            + Add product
          </Link>
        </div>
      </div>

      {sp.imported && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
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

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          {sp.q || sp.category
            ? "Nothing matches that."
            : "No products yet. Add your first one."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-mono text-[10px] text-muted">
                    no photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/desk/catalog/${p.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {p.name}
                  {p.archivedAt && (
                    <span className="ml-2 font-mono text-[10px] uppercase text-muted">
                      archived
                    </span>
                  )}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span>
                    {p.price} {/* currency symbol added in a later polish pass */}
                  </span>
                  {p.category && <span>· {p.category}</span>}
                  {p.isLowStock && (
                    <span className="rounded bg-lime/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink">
                      low stock
                    </span>
                  )}
                </div>
              </div>

              <StockEditor productId={p.id} stockQty={p.stockQty} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
