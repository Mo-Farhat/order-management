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

  // Billing (schema now, UI in Phase 5).
  planStatus: planStatusEnum("plan_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at", { mode: "date", withTimezone: true }),

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

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Product = typeof products.$inferSelect;
export type ProductPhoto = typeof productPhotos.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockMovementReason = (typeof stockMovementReasonEnum.enumValues)[number];
