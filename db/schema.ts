import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Phase 1 schema: tenancy, auth, and the RBAC skeleton.
 *
 * Every tenant-scoped table carries `tenantId` as the first predicate for all
 * access (see NFR "multi-tenant isolation"). Postgres row-level security is
 * layered on top in `scripts/apply-rls.ts` as a second line of defence.
 */

export const roleEnum = pgEnum("role", ["owner", "staff", "viewer"]);

export const planStatusEnum = pgEnum("plan_status", [
  "trialing",
  "active",
  "past_due",
  "read_only",
  "cancelled",
]);

// Order lifecycle. `draft/packed/shipped/delivered` are legacy values kept in
// the type for historical `order_events` rows — the app only uses the four
// below (see lib/pipeline.ts ORDER_STATUSES). Fulfilment progress is tracked
// separately in `deliveryStatusEnum`.
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "returned",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "dispatched",
  "delivered",
]);

export const discountTypeEnum = pgEnum("discount_type", ["none", "flat", "percent"]);

export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "partial", "paid"]);

export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "initial", // set when the product is created
  "manual_adjustment", // quick stock editor / edit form
  "import", // CSV bulk import
  "order_confirmed", // Phase 3: stock decremented (FR-5)
  "order_cancelled", // Phase 3: stock restored (FR-5)
]);

// --- Tenancy ---------------------------------------------------------------

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // Public share-link slug: desk.<domain>/{slug}
  slug: text("slug").notNull().unique(),
  whatsappNumber: text("whatsapp_number"),

  // Configuration-over-customisation settings, present on every tenant from day one.
  currency: text("currency").notNull().default("LKR"),
  stockTrackingEnabled: boolean("stock_tracking_enabled").notNull().default(true),
  deliveryFeeDefault: numeric("delivery_fee_default", { precision: 12, scale: 2 }),
  publicPagePaused: boolean("public_page_paused").notNull().default(false),
  // Public share-link presentation (Phase 4, FR-15–18).
  accentColor: text("accent_color"),
  logoKey: text("logo_key"),
  sharePolicyText: text("share_policy_text"),
  // Ordered list of category names shown as filter chips on the storefront.
  // Null = fall back to every distinct product category.
  storefrontCategories: jsonb("storefront_categories").$type<string[]>(),

  // Billing (schema now, UI in Phase 5).
  planStatus: planStatusEnum("plan_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { mode: "date", withTimezone: true }),

  // FR-23: when the owner last dismissed the "upgrade to a website" banner.
  upsellDismissedAt: timestamp("upsell_dismissed_at", { withTimezone: true }),

  // Per-tenant human-readable order numbering (FR-8). Incremented in the
  // create-order transaction.
  nextOrderNumber: integer("next_order_number").notNull().default(1),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Users & membership --------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),

  // Credentials auth. Null when the user only ever signs in with a magic link.
  hashedPassword: text("hashed_password"),
  // Bumped on every password change; any session/token issued earlier is rejected (FR-2).
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_user_tenant_uq").on(t.userId, t.tenantId),
    index("memberships_tenant_idx").on(t.tenantId),
  ],
);

// --- Catalog (Phase 2) -------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    stockQty: integer("stock_qty").notNull().default(0),

    // "More details" — all optional (catalog UX S2).
    description: text("description"),
    category: text("category"),
    lowStockThreshold: integer("low_stock_threshold"),
    sku: text("sku"),

    // Soft delete (FR-6): archived products leave the public page and the
    // new-order grid but stay attached to historical orders.
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    // Hidden from the public storefront only — still fully usable for internal
    // (DM/WhatsApp) orders. Independent of archive.
    storefrontHidden: boolean("storefront_hidden").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_tenant_idx").on(t.tenantId, t.archivedAt),
    index("products_tenant_category_idx").on(t.tenantId, t.category),
  ],
);

export const productPhotos = pgTable(
  "product_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Storage key in the object store (R2). The public URL is derived from it.
    key: text("key").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("product_photos_product_idx").on(t.productId, t.sortOrder)],
);

/**
 * Append-only stock ledger (FR-5). Every change to `products.stock_qty` writes
 * one row here with the delta, the resulting balance, who did it, and why.
 */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: stockMovementReasonEnum("reason").notNull(),
    // Phase 3 wires the FK; kept nullable and unconstrained for now.
    orderId: uuid("order_id"),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stock_movements_product_idx").on(t.productId, t.createdAt)],
);

// --- Order Desk (Phase 3) --------------------------------------------

/**
 * Customers are created automatically from orders (FR-13), keyed on phone
 * number within a tenant. There is no standalone "add customer" flow.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // Nullable: an order can be created with just a name. When a phone IS given
    // it dedupes (Postgres unique index treats NULLs as distinct).
    phone: text("phone"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_tenant_phone_uq").on(t.tenantId, t.phone)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    orderNumber: integer("order_number").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),

    status: orderStatusEnum("status").notNull().default("confirmed"),
    deliveryStatus: deliveryStatusEnum("delivery_status").notNull().default("pending"),
    courier: text("courier"),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),

    // Money — all snapshot at their moment; editing a product later never
    // changes an existing order (FR-10).
    deliveryFee: numeric("delivery_fee", { precision: 12, scale: 2 }).notNull().default("0"),
    discountType: discountTypeEnum("discount_type").notNull().default("none"),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),

    // Fulfilment + payment details captured on the order itself.
    deliveryAddress: text("delivery_address"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),

    note: text("note"),

    // True once stock has been decremented for this order (on Confirm). Drives
    // whether Cancel/Return restores stock (FR-5).
    stockCommitted: boolean("stock_committed").notNull().default(false),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_tenant_number_uq").on(t.tenantId, t.orderNumber),
    index("orders_tenant_status_idx").on(t.tenantId, t.status, t.updatedAt),
    index("orders_customer_idx").on(t.customerId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Product may later be archived; kept for reordering/analytics. Never null
    // in v1 because deletion is blocked once ordered (FR-6).
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    nameSnapshot: text("name_snapshot").notNull(),
    priceSnapshot: numeric("price_snapshot", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    // Per-line request — custom sizing, colour, "for Sara", etc.
    note: text("note"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Append-only timeline: one row per status change or note edit (FR-11). */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status"),
    kind: text("kind").notNull(), // "created" | "status" | "note" | "edited"
    note: text("note"),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

/**
 * Share-link handoff (Phase 4, FR-15–18). When a public visitor taps
 * "Order on WhatsApp", their selection is frozen here with a short reference
 * code. The owner pastes that code into the new-order flow to pull the lines
 * into a Draft. No customer account, no payment — this is the bridge only.
 */
export const shareCarts = pgTable(
  "share_carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    items: jsonb("items").notNull().$type<
      { productId: string; nameSnapshot: string; priceSnapshot: string; quantity: number }[]
    >(),
    note: text("note"),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    customerAddress: text("customer_address"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("pending"), // "pending" | "imported"
    importedOrderId: uuid("imported_order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("share_carts_tenant_code_uq").on(t.tenantId, t.code),
    index("share_carts_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);

/**
 * Scoped, revocable read API keys (FR-22). Each key exposes /api/v1/products
 * and /api/v1/catalog for one tenant so an external website can render a
 * storefront without touching the Order Desk database directly. Only the
 * SHA-256 hash is stored; the plaintext is shown once at creation.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(), // e.g. "sd_live_a1b2c3d4" — for display
    hashedKey: text("hashed_key").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_hashed_uq").on(t.hashedKey),
    index("api_keys_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);

// --- Audit log ----------------------------------------------------------

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_tenant_idx").on(t.tenantId, t.createdAt)],
);

// --- Auth.js adapter tables -------------------------------------------
// Shapes required by @auth/drizzle-adapter. Sessions are stored as JWTs
// (Credentials provider requires it), but the adapter still expects the
// table to exist for the schema contract, so we keep it.

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// --- Password reset + rate limiting ----------------------------------

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(), // sha-256 of the emailed token
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("password_reset_token_hash_uq").on(t.tokenHash),
    index("password_reset_user_idx").on(t.userId),
  ],
);

/** Fixed-window rate limiter (public unauthenticated endpoints). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Product = typeof products.$inferSelect;
export type ProductPhoto = typeof productPhotos.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockMovementReason = (typeof stockMovementReasonEnum.enumValues)[number];
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type ShareCart = typeof shareCarts.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type DeliveryStatus = (typeof deliveryStatusEnum.enumValues)[number];
export type DiscountType = (typeof discountTypeEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type PlanStatus = (typeof planStatusEnum.enumValues)[number];
