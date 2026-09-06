import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { productPhotos, products, shareCarts, tenants } from "@/db/schema";
import { publicUrlForKey } from "@/lib/storage";
import { computeTotals, fromCents, toCents } from "@/lib/money";
import type { ActiveContext } from "@/lib/session";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export type StorefrontProduct = {
  id: string;
  name: string;
  price: string;
  category: string | null;
  photoUrl: string | null;
  stockState: "in" | "low" | "out";
};

export type StorefrontTenant = {
  name: string;
  slug: string;
  currency: string;
  whatsappNumber: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  sharePolicyText: string | null;
};

export type Storefront = {
  tenant: StorefrontTenant;
  categories: string[];
  products: StorefrontProduct[];
};

function stockStateOf(
  p: { stockQty: number; lowStockThreshold: number | null },
  tracking: boolean,
): "in" | "low" | "out" {
  if (!tracking) return "in";
  if (p.stockQty <= 0) return "out";
  if (p.lowStockThreshold != null && p.stockQty <= p.lowStockThreshold) return "low";
  return "in";
}

/** Ordered chip list: the owner's picks (that still have products), else distinct. */
function storefrontChips(
  configured: string[] | null,
  productCategories: (string | null)[],
): string[] {
  const present = new Set(productCategories.filter((c): c is string => !!c));
  // null = never configured → show every distinct category.
  // any array (incl. []) = an explicit choice, kept to categories that still exist.
  if (configured) return configured.filter((c) => present.has(c));
  return [...present].sort();
}

/** Public read for `/s/{slug}`. `paused` when the owner switched the page off. */
export async function getStorefront(
  slug: string,
): Promise<Storefront | { paused: true; name: string } | null> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) });
  if (!tenant) return null;
  if (tenant.publicPagePaused) return { paused: true, name: tenant.name };

  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), isNull(products.archivedAt)))
    .orderBy(asc(products.name));

  const photos = rows.length
    ? await db
        .select()
        .from(productPhotos)
        .where(eq(productPhotos.tenantId, tenant.id))
        .orderBy(productPhotos.sortOrder)
    : [];
  const firstPhoto = new Map<string, string>();
  for (const ph of photos) {
    if (!firstPhoto.has(ph.productId)) firstPhoto.set(ph.productId, publicUrlForKey(ph.key));
  }

  const tenantOut: StorefrontTenant = {
    name: tenant.name,
    slug: tenant.slug,
    currency: tenant.currency,
    whatsappNumber: tenant.whatsappNumber,
    accentColor: tenant.accentColor,
    logoUrl: tenant.logoKey ? publicUrlForKey(tenant.logoKey) : null,
    sharePolicyText: tenant.sharePolicyText,
  };

  return {
    tenant: tenantOut,
    categories: storefrontChips(tenant.storefrontCategories, rows.map((r) => r.category)),
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      photoUrl: firstPhoto.get(p.id) ?? null,
      stockState: stockStateOf(p, tenant.stockTrackingEnabled),
    })),
  };
}

export type StorefrontProductDetail = {
  tenant: StorefrontTenant;
  product: {
    id: string;
    name: string;
    price: string;
    description: string | null;
    category: string | null;
    stockState: "in" | "low" | "out";
    photos: string[];
  };
};

/** Public read for `/s/{slug}/{id}` — the per-product page. */
export async function getStorefrontProduct(
  slug: string,
  productId: string,
): Promise<StorefrontProductDetail | null> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) });
  if (!tenant || tenant.publicPagePaused) return null;

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.tenantId, tenant.id),
      isNull(products.archivedAt),
    ),
  });
  if (!product) return null;

  const photos = await db
    .select()
    .from(productPhotos)
    .where(eq(productPhotos.productId, product.id))
    .orderBy(productPhotos.sortOrder);

  return {
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      currency: tenant.currency,
      whatsappNumber: tenant.whatsappNumber,
      accentColor: tenant.accentColor,
      logoUrl: tenant.logoKey ? publicUrlForKey(tenant.logoKey) : null,
      sharePolicyText: tenant.sharePolicyText,
    },
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      stockState: stockStateOf(product, tenant.stockTrackingEnabled),
      photos: photos.map((ph) => publicUrlForKey(ph.key)),
    },
  };
}

export type HandoffInput = {
  slug: string;
  items: { productId: string; quantity: number }[];
  note?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
};

export type HandoffResult = {
  code: string;
  waNumber: string | null;
  message: string;
  subtotal: string;
  currency: string;
};

/** Freezes a public visitor's selection and returns a WhatsApp deep-link body. */
export async function createShareHandoff(input: HandoffInput): Promise<HandoffResult> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, input.slug) });
  if (!tenant || tenant.publicPagePaused) throw new Error("This page isn't taking orders right now.");

  const clean = input.items.filter((i) => i.quantity > 0);
  if (clean.length === 0) throw new Error("Add at least one item first.");

  const catalog = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), isNull(products.archivedAt)));
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const lines = clean.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("One of the items is no longer available.");
    return {
      productId: p.id,
      nameSnapshot: p.name,
      priceSnapshot: p.price,
      priceCents: toCents(p.price),
      quantity: i.quantity,
    };
  });

  const totals = computeTotals({
    items: lines,
    deliveryFeeCents: 0,
    discountType: "none",
    discountValue: 0,
  });
  const subtotal = fromCents(totals.subtotalCents);

  // Allocate a code, retrying on the (tenant, code) unique collision.
  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    code = randomCode();
    try {
      await db.insert(shareCarts).values({
        tenantId: tenant.id,
        code,
        items: lines.map(({ productId, nameSnapshot, priceSnapshot, quantity }) => ({
          productId,
          nameSnapshot,
          priceSnapshot,
          quantity,
        })),
        note: input.note?.trim() || null,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerAddress: input.deliveryAddress.trim(),
        subtotal,
      });
      break;
    } catch (err) {
      if (attempt === 7) throw err;
    }
  }

  const cur = tenant.currency;
  const body = [
    `Hi ${tenant.name}! I'd like to order:`,
    ...lines.map((l) => `• ${l.quantity} × ${l.nameSnapshot} (${cur} ${l.priceSnapshot})`),
    ``,
    `Subtotal: ${cur} ${subtotal}`,
    ``,
    `Name: ${input.customerName.trim()}`,
    `Phone: ${input.customerPhone.trim()}`,
    `Address: ${input.deliveryAddress.trim()}`,
    input.note?.trim() ? `Note: ${input.note.trim()}` : ``,
    `Reference: ${code}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    code,
    waNumber: tenant.whatsappNumber ? tenant.whatsappNumber.replace(/[^0-9]/g, "") : null,
    message: body,
    subtotal,
    currency: cur,
  };
}

/** Owner-side: look up a pending handoff by its reference code. */
export async function getShareCartByCode(ctx: ActiveContext, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const cart = await db.query.shareCarts.findFirst({
    where: and(eq(shareCarts.tenantId, ctx.tenantId), eq(shareCarts.code, code)),
  });
  if (!cart) return null;
  return {
    code: cart.code,
    status: cart.status,
    note: cart.note ?? "",
    customerName: cart.customerName ?? "",
    customerPhone: cart.customerPhone ?? "",
    deliveryAddress: cart.customerAddress ?? "",
    items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    createdAt: cart.createdAt,
  };
}

export async function markShareCartImported(
  ctx: ActiveContext,
  code: string,
  orderId: string,
): Promise<void> {
  await db
    .update(shareCarts)
    .set({ status: "imported", importedOrderId: orderId })
    .where(
      and(
        eq(shareCarts.tenantId, ctx.tenantId),
        eq(shareCarts.code, code.trim().toUpperCase()),
      ),
    );
}

export async function recentShareCarts(ctx: ActiveContext, limit = 10) {
  return db
    .select({
      code: shareCarts.code,
      status: shareCarts.status,
      subtotal: shareCarts.subtotal,
      customerName: shareCarts.customerName,
      createdAt: shareCarts.createdAt,
    })
    .from(shareCarts)
    .where(eq(shareCarts.tenantId, ctx.tenantId))
    .orderBy(desc(shareCarts.createdAt))
    .limit(limit);
}
