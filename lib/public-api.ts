import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { productPhotos, products, tenants } from "@/db/schema";
import { publicUrlForKey } from "@/lib/storage";

/** Shape returned by GET /api/v1/products (FR-22). Stable, versioned contract. */
export type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  price: string;
  currency: string;
  in_stock: boolean;
  photos: string[];
};

export async function getApiCatalog(tenantId: string): Promise<{
  business: { name: string; slug: string; currency: string };
  categories: string[];
  products: ApiProduct[];
} | null> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
  if (!tenant) return null;

  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.archivedAt)))
    .orderBy(asc(products.name));

  const photos = rows.length
    ? await db
        .select()
        .from(productPhotos)
        .where(eq(productPhotos.tenantId, tenantId))
        .orderBy(productPhotos.sortOrder)
    : [];
  const byProduct = new Map<string, string[]>();
  for (const ph of photos) {
    const list = byProduct.get(ph.productId) ?? [];
    list.push(publicUrlForKey(ph.key));
    byProduct.set(ph.productId, list);
  }

  const apiProducts: ApiProduct[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    category: p.category,
    price: p.price,
    currency: tenant.currency,
    in_stock: tenant.stockTrackingEnabled ? p.stockQty > 0 : true,
    photos: byProduct.get(p.id) ?? [],
  }));

  const categories = [
    ...new Set(apiProducts.map((p) => p.category).filter((c): c is string => !!c)),
  ].sort();

  return {
    business: { name: tenant.name, slug: tenant.slug, currency: tenant.currency },
    categories,
    products: apiProducts,
  };
}
