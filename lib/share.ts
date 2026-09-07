import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { memberships, productPhotos, products, tenants, users } from "@/db/schema";
import { publicUrlForKey } from "@/lib/storage";
import { computeTotals, fromCents, toCents } from "@/lib/money";
import { normalizePhone, toWhatsAppNumber } from "@/lib/phone";
import { sendNewOrderEmail } from "@/lib/email";
import { appUrl } from "@/lib/constants";
import type { ActiveContext } from "@/lib/session";

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
  instagramHandle: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  sharePolicyText: string | null;
};

function storefrontTenant(t: typeof tenants.$inferSelect): StorefrontTenant {
  return {
    name: t.name,
    slug: t.slug,
    currency: t.currency,
    whatsappNumber: t.whatsappNumber,
    instagramHandle: t.instagramHandle,
    accentColor: t.accentColor,
    logoUrl: t.logoKey ? publicUrlForKey(t.logoKey) : null,
    sharePolicyText: t.sharePolicyText,
  };
}

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
    .where(and(eq(products.tenantId, tenant.id), isNull(products.archivedAt), eq(products.storefrontHidden, false)))
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

  return {
    tenant: storefrontTenant(tenant),
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
      eq(products.storefrontHidden, false),
    ),
  });
  if (!product) return null;

  const photos = await db
    .select()
    .from(productPhotos)
    .where(eq(productPhotos.productId, product.id))
    .orderBy(productPhotos.sortOrder);

  return {
    tenant: storefrontTenant(tenant),
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
  orderId: string;
  orderNumber: number;
  message: string;
  currency: string;
  whatsapp: string | null;   // wa.me deep link with the message pre-filled
  instagram: string | null;  // ig.me DM link (message is copied client-side)
};

/**
 * Email the shop owner(s) that a storefront order came in. Best-effort — a mail
 * outage must never break ordering, so callers swallow failures.
 */
async function notifyOwnersOfStorefrontOrder(args: {
  tenantId: string;
  shopName: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  currency: string;
  total: string;
  items: string[];
  note?: string;
}): Promise<void> {
  const owners = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.tenantId, args.tenantId), eq(memberships.role, "owner")));

  const to = owners.map((o) => o.email).filter(Boolean);
  if (to.length === 0) return;

  await sendNewOrderEmail(to, {
    shopName: args.shopName,
    orderNumber: args.orderNumber,
    customerName: args.customerName,
    customerPhone: args.customerPhone,
    currency: args.currency,
    total: args.total,
    items: args.items,
    note: args.note,
    url: appUrl(`/desk/orders/${args.orderId}`),
  });
}

/**
 * A public visitor placed an order. Creates it as a `pending` order (owner
 * Accepts later) and returns the channel links + the message to send.
 */
export async function createShareHandoff(input: HandoffInput): Promise<HandoffResult> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, input.slug) });
  if (!tenant || tenant.publicPagePaused) throw new Error("This page isn't taking orders right now.");
  if (!tenant.whatsappNumber && !tenant.instagramHandle) {
    throw new Error("This shop hasn't set up a way to receive orders yet.");
  }

  const clean = input.items.filter((i) => i.quantity > 0);
  if (clean.length === 0) throw new Error("Add at least one item first.");

  const catalog = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), isNull(products.archivedAt), eq(products.storefrontHidden, false)));
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const lines = clean.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("One of the items is no longer available.");
    return { name: p.name, price: p.price, priceCents: toCents(p.price), quantity: i.quantity };
  });
  const totals = computeTotals({
    items: lines.map((l) => ({ priceCents: l.priceCents, quantity: l.quantity })),
    deliveryFeeCents: 0,
    discountType: "none",
    discountValue: 0,
  });
  const subtotal = fromCents(totals.subtotalCents);

  const { createStorefrontOrder } = await import("@/lib/orders");
  const order = await createStorefrontOrder(tenant.id, {
    customerName: input.customerName.trim(),
    customerPhone: normalizePhone(input.customerPhone) ?? input.customerPhone.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
    items: clean,
    note: input.note?.trim() || undefined,
  });

  const cur = tenant.currency;
  const message = [
    `Hi ${tenant.name}! I'd like to order (ref #${order.orderNumber}):`,
    ...lines.map((l) => `• ${l.quantity} × ${l.name} (${cur} ${l.price})`),
    ``,
    `Subtotal: ${cur} ${subtotal}`,
    ``,
    `Name: ${input.customerName.trim()}`,
    `Phone: ${input.customerPhone.trim()}`,
    `Address: ${input.deliveryAddress.trim()}`,
    input.note?.trim() ? `Note: ${input.note.trim()}` : ``,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await notifyOwnersOfStorefrontOrder({
      tenantId: tenant.id,
      shopName: tenant.name,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      currency: cur,
      total: subtotal,
      items: lines.map((l) => `${l.quantity} × ${l.name} (${cur} ${l.price})`),
      note: input.note?.trim() || undefined,
    });
  } catch (err) {
    console.error("[share] new-order email failed", err);
  }

  const waNumber = toWhatsAppNumber(tenant.whatsappNumber);
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    message,
    currency: cur,
    whatsapp: waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null,
    instagram: tenant.instagramHandle ? `https://ig.me/m/${tenant.instagramHandle}` : null,
  };
}

/** Owner-side: the storefront orders currently awaiting Accept / Decline. */
export async function pendingStorefrontOrders(ctx: ActiveContext) {
  const { orders, customers } = await import("@/db/schema");
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      customerName: customers.name,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.tenantId, ctx.tenantId), eq(orders.status, "pending")))
    .orderBy(desc(orders.createdAt))
    .limit(20);
}
