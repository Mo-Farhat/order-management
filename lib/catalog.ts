import "server-only";
import { and, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { withTenant, type Tx } from "@/db/tenant";
import {
  auditLog,
  productPhotos,
  productVariants,
  products,
  stockMovements,
  type Product,
  type ProductVariant,
  type StockMovementReason,
} from "@/db/schema";
import { publicUrlForKey } from "@/lib/storage";
import type { ActiveContext } from "@/lib/session";
import type { ProductInput, ProductOptionsInput } from "@/lib/validation";
import { variantLabel } from "@/lib/industries";

const ORDER_REASONS: StockMovementReason[] = ["order_confirmed", "order_cancelled"];

export type ProductListItem = Product & {
  photoUrl: string | null;
  isLowStock: boolean;
  /** Present when the product has options — stock is then edited per variant. */
  variants: VariantSummary[];
};

export type VariantSummary = {
  id: string;
  label: string;
  option1: string;
  option2: string | null;
  price: string | null;
  stockQty: number;
};

function summarize(v: ProductVariant): VariantSummary {
  return {
    id: v.id,
    label: variantLabel(v.option1, v.option2),
    option1: v.option1,
    option2: v.option2,
    price: v.price,
    stockQty: v.stockQty,
  };
}

/** Variants for a set of products, grouped by product id, in display order. */
export async function variantsFor(
  tenantId: string,
  productIds: string[],
): Promise<Map<string, VariantSummary[]>> {
  const out = new Map<string, VariantSummary[]>();
  if (productIds.length === 0) return out;
  const rows = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.tenantId, tenantId), inArray(productVariants.productId, productIds)))
    .orderBy(productVariants.sortOrder);
  for (const v of rows) {
    const list = out.get(v.productId) ?? [];
    list.push(summarize(v));
    out.set(v.productId, list);
  }
  return out;
}

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
    storefrontHidden: input.storefrontHidden ?? false,
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

  const variants = await variantsFor(
    ctx.tenantId,
    rows.filter((r) => r.option1Name).map((r) => r.id),
  );

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
    variants: variants.get(p.id) ?? [],
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
        eq(products.storefrontHidden, false),
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

  const [photos, movements, orderMovement, variantRows] = await Promise.all([
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
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(productVariants.sortOrder),
  ]);

  const labelById = new Map(variantRows.map((v) => [v.id, variantLabel(v.option1, v.option2)]));

  return {
    product,
    variants: variantRows.map(summarize),
    variantLabelById: labelById,
    photos: photos.map((ph) => ({ ...ph, url: publicUrlForKey(ph.key) })),
    movements,
    isLowStock: lowStock(product),
    hasOrderHistory: orderMovement.length > 0,
  };
}

/**
 * Replace a product's options with `opts`: update variants that kept their id,
 * insert new ones, delete dropped ones, and write a stock movement for every
 * per-variant stock change. Returns the new total stock (sum of variants), or
 * null when the product has no options.
 */
async function syncVariants(
  tx: Tx,
  ctx: ActiveContext,
  productId: string,
  opts: ProductOptionsInput,
  reason: "initial" | "manual_adjustment",
): Promise<number | null> {
  const existing = await tx
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.tenantId, ctx.tenantId)));
  const byId = new Map(existing.map((v) => [v.id, v]));
  const two = Boolean(opts.option2Name);

  const keep = new Set<string>();
  let total = 0;
  for (const [i, x] of opts.variants.entries()) {
    const values = {
      option1: x.option1,
      option2: two ? x.option2 || null : null,
      price: x.price === "" ? null : x.price,
      stockQty: x.stockQty,
      sortOrder: i,
      updatedAt: new Date(),
    };
    total += x.stockQty;
    const prev = x.id ? byId.get(x.id) : undefined;
    let variantId: string;
    let delta: number;
    if (prev) {
      keep.add(prev.id);
      variantId = prev.id;
      delta = x.stockQty - prev.stockQty;
      await tx.update(productVariants).set(values).where(eq(productVariants.id, prev.id));
    } else {
      const [row] = await tx
        .insert(productVariants)
        .values({ tenantId: ctx.tenantId, productId, ...values })
        .returning({ id: productVariants.id });
      variantId = row.id;
      delta = x.stockQty;
    }
    if (delta !== 0) {
      await tx.insert(stockMovements).values({
        tenantId: ctx.tenantId,
        productId,
        variantId,
        delta,
        balanceAfter: x.stockQty,
        reason: prev ? reason : "initial",
        actorUserId: ctx.userId,
        note: variantLabel(values.option1, values.option2),
      });
    }
  }

  const dropped = existing.filter((v) => !keep.has(v.id)).map((v) => v.id);
  if (dropped.length) await tx.delete(productVariants).where(inArray(productVariants.id, dropped));

  await tx
    .update(products)
    .set({
      option1Name: opts.variants.length ? opts.option1Name : null,
      option2Name: opts.variants.length && two ? opts.option2Name : null,
    })
    .where(eq(products.id, productId));

  return opts.variants.length ? total : null;
}

export async function createProduct(
  ctx: ActiveContext,
  input: ProductInput,
  opts?: ProductOptionsInput,
): Promise<string> {
  const v = normalize(input);
  const withOptions = Boolean(opts?.variants.length);
  if (withOptions) v.stockQty = opts!.variants.reduce((n, x) => n + x.stockQty, 0);
  return withTenant(ctx.tenantId, async (tx) => {
    const [row] = await tx
      .insert(products)
      .values({ tenantId: ctx.tenantId, ...v, price: v.price })
      .returning({ id: products.id });

    if (withOptions) {
      await syncVariants(tx, ctx, row.id, opts!, "initial");
    } else if (v.stockQty !== 0) {
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
  opts?: ProductOptionsInput,
): Promise<void> {
  const v = normalize(input);
  await withTenant(ctx.tenantId, async (tx) => {
    const existing = await tx.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)),
    });
    if (!existing) throw new Error("Product not found.");

    // Options on (or switched off): variants own the stock; the product row
    // just mirrors their sum and the movements are written per variant.
    const optionTotal = opts ? await syncVariants(tx, ctx, id, opts, "manual_adjustment") : null;
    if (optionTotal !== null) v.stockQty = optionTotal;

    await tx
      .update(products)
      .set({ ...v, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.tenantId)));

    const delta = v.stockQty - existing.stockQty;
    if (delta !== 0 && optionTotal === null) {
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
    if (existing.option1Name) {
      throw new Error("This product has options — set stock per option on its page.");
    }

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

export const MAX_PHOTOS = 4;

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
