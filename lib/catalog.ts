import "server-only";
import { and, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { withTenant } from "@/db/tenant";
import {
  auditLog,
  productPhotos,
  products,
  stockMovements,
  type Product,
  type StockMovementReason,
} from "@/db/schema";
import { publicUrlForKey } from "@/lib/storage";
import type { ActiveContext } from "@/lib/session";
import type { ProductInput } from "@/lib/validation";

const ORDER_REASONS: StockMovementReason[] = ["order_confirmed", "order_cancelled"];

export type ProductListItem = Product & {
  photoUrl: string | null;
  isLowStock: boolean;
};

function lowStock(p: Pick<Product, "stockQty" | "lowStockThreshold">): boolean {
  return p.lowStockThreshold != null && p.stockQty <= p.lowStockThreshold;
}

function normalize(input: ProductInput) {
  return {
    name: input.name,
    price: input.price,
    stockQty: input.stockQty,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    lowStockThreshold:
      input.lowStockThreshold === "" || input.lowStockThreshold == null
        ? null
        : Number(input.lowStockThreshold),
    sku: input.sku?.trim() || null,
  };
}

export async function listProducts(
  ctx: ActiveContext,
  opts: { search?: string; category?: string; includeArchived?: boolean } = {},
): Promise<ProductListItem[]> {
  const filters = [eq(products.tenantId, ctx.tenantId)];
  if (!opts.includeArchived) filters.push(isNull(products.archivedAt));
  if (opts.search?.trim()) filters.push(ilike(products.name, `%${opts.search.trim()}%`));
  if (opts.category?.trim()) filters.push(eq(products.category, opts.category.trim()));

  const rows = await db
    .select()
    .from(products)
    .where(and(...filters))
    .orderBy(desc(products.createdAt));

  if (rows.length === 0) return [];

  const photos = await db
    .select()
    .from(productPhotos)
    .where(
      and(
        eq(productPhotos.tenantId, ctx.tenantId),
        inArray(
          productPhotos.productId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .orderBy(productPhotos.sortOrder);

  const firstPhoto = new Map<string, string>();
  for (const ph of photos) {
    if (!firstPhoto.has(ph.productId)) firstPhoto.set(ph.productId, publicUrlForKey(ph.key));
  }

  return rows.map((p) => ({
    ...p,
    photoUrl: firstPhoto.get(p.id) ?? null,
    isLowStock: lowStock(p),
  }));
}

export async function distinctCategories(ctx: ActiveContext): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(
      and(
        eq(products.tenantId, ctx.tenantId),
        isNull(products.archivedAt),
        sql`${products.category} is not null and ${products.category} <> ''`,
      ),
    )
    .orderBy(products.category);
  return rows.map((r) => r.category!).filter(Boolean);
}

export async function getProduct(ctx: ActiveContext, id: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)),
  });
  if (!product) return null;

  const [photos, movements, orderMovement] = await Promise.all([
    db
      .select()
      .from(productPhotos)
      .where(eq(productPhotos.productId, id))
      .orderBy(productPhotos.sortOrder),
    db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(50),
    db
      .select({ id: stockMovements.id })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.productId, id),
          inArray(stockMovements.reason, ORDER_REASONS),
        ),
      )
      .limit(1),
  ]);

  return {
    product,
    photos: photos.map((ph) => ({ ...ph, url: publicUrlForKey(ph.key) })),
    movements,
    isLowStock: lowStock(product),
    hasOrderHistory: orderMovement.length > 0,
  };
}

export async function createProduct(
  ctx: ActiveContext,
  input: ProductInput,
): Promise<string> {
  const v = normalize(input);
  return withTenant(ctx.tenantId, async (tx) => {
    const [row] = await tx
      .insert(products)
      .values({ tenantId: ctx.tenantId, ...v, price: v.price })
      .returning({ id: products.id });

    if (v.stockQty !== 0) {
      await tx.insert(stockMovements).values({
        tenantId: ctx.tenantId,
        productId: row.id,
        delta: v.stockQty,
        balanceAfter: v.stockQty,
        reason: "initial",
        actorUserId: ctx.userId,
      });
    }

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "product.created",
      entity: "product",
      entityId: row.id,
      after: v,
    });

    return row.id;
  });
}

export async function updateProduct(
  ctx: ActiveContext,
  id: string,
  input: ProductInput,
): Promise<void> {
  const v = normalize(input);
  await withTenant(ctx.tenantId, async (tx) => {
    const existing = await tx.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)),
    });
    if (!existing) throw new Error("Product not found.");

    await tx
      .update(products)
      .set({ ...v, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));

    const delta = v.stockQty - existing.stockQty;
    if (delta !== 0) {
      await tx.insert(stockMovements).values({
        tenantId: ctx.tenantId,
        productId: id,
        delta,
        balanceAfter: v.stockQty,
        reason: "manual_adjustment",
        actorUserId: ctx.userId,
        note: "Edited on the product form",
      });
    }

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "product.updated",
      entity: "product",
      entityId: id,
      before: {
        name: existing.name,
        price: existing.price,
        stockQty: existing.stockQty,
        category: existing.category,
      },
      after: v,
    });
  });
}

/** Quick stock editor (FR-4 / catalog S4). Sets an absolute quantity. */
export async function setStock(
  ctx: ActiveContext,
  id: string,
  stockQty: number,
  note?: string,
): Promise<number> {
  return withTenant(ctx.tenantId, async (tx) => {
    const existing = await tx.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)),
    });
    if (!existing) throw new Error("Product not found.");

    const delta = stockQty - existing.stockQty;
    if (delta === 0) return stockQty;

    await tx
      .update(products)
      .set({ stockQty, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));

    await tx.insert(stockMovements).values({
      tenantId: ctx.tenantId,
      productId: id,
      delta,
      balanceAfter: stockQty,
      reason: "manual_adjustment",
      actorUserId: ctx.userId,
      note: note?.trim() || null,
    });

    await tx.insert(auditLog).values({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: "product.stock_adjusted",
      entity: "product",
      entityId: id,
      before: { stockQty: existing.stockQty },
      after: { stockQty },
    });

    return stockQty;
  });
}

export async function setArchived(
  ctx: ActiveContext,
  id: string,
  archived: boolean,
): Promise<void> {
  await db
    .update(products)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));

  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: archived ? "product.archived" : "product.unarchived",
    entity: "product",
    entityId: id,
  });
}

export const MAX_PHOTOS = 6;

export async function addProductPhotoKey(
  ctx: ActiveContext,
  productId: string,
  key: string,
): Promise<void> {
  const existing = await db
    .select({ id: productPhotos.id })
    .from(productPhotos)
    .where(and(eq(productPhotos.productId, productId), eq(productPhotos.tenantId, ctx.tenantId)));
  if (existing.length >= MAX_PHOTOS) {
    throw new Error(`A product can have at most ${MAX_PHOTOS} photos.`);
  }
  await db.insert(productPhotos).values({
    tenantId: ctx.tenantId,
    productId,
    key,
    sortOrder: existing.length,
  });
}

export async function removeProductPhoto(
  ctx: ActiveContext,
  photoId: string,
): Promise<string | null> {
  const [row] = await db
    .delete(productPhotos)
    .where(and(eq(productPhotos.id, photoId), eq(productPhotos.tenantId, ctx.tenantId)))
    .returning({ key: productPhotos.key });
  return row?.key ?? null;
}

export class DeleteBlockedError extends Error {
  constructor() {
    super("This product has order history, so it can't be deleted — archive it instead.");
    this.name = "DeleteBlockedError";
  }
}

/** FR-6: hard delete only when the product has never appeared in an order. */
export async function deleteProduct(ctx: ActiveContext, id: string): Promise<string[]> {
  const orderMovement = await db
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(eq(stockMovements.productId, id), inArray(stockMovements.reason, ORDER_REASONS)),
    )
    .limit(1);
  if (orderMovement.length > 0) throw new DeleteBlockedError();

  const photos = await db
    .select({ key: productPhotos.key })
    .from(productPhotos)
    .where(and(eq(productPhotos.productId, id), eq(productPhotos.tenantId, ctx.tenantId)));

  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));

  await db.insert(auditLog).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: "product.deleted",
    entity: "product",
    entityId: id,
  });

  return photos.map((p) => p.key);
}
