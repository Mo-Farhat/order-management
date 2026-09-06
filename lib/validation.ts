import * as z from "zod";

export const emailSchema = z.email({ error: "Enter a valid email address." });

export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(200, { error: "That password is too long." });

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

// Business basics (PRD onboarding S2): name + WhatsApp number, nothing else.
export const businessBasicsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Business name must be at least 2 characters." })
    .max(80, { error: "Keep the business name under 80 characters." }),
  whatsappNumber: z
    .string()
    .trim()
    .min(6, { error: "Enter a valid WhatsApp number." })
    .max(24, { error: "Enter a valid WhatsApp number." })
    .regex(/^\+?[0-9\s-]+$/, { error: "Digits, spaces, and a leading + only." }),
});

// --- Settings ----------------------------------------------------------

export const businessSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Business name must be at least 2 characters." })
    .max(80, { error: "Keep the business name under 80 characters." }),
  currency: z
    .string()
    .trim()
    .min(1, { error: "Enter a currency code." })
    .max(6, { error: "Use a short code like LKR or USD." })
    .transform((v) => v.toUpperCase()),
  deliveryFeeDefault: z
    .union([z.literal(""), z.string().trim().regex(/^\d+(\.\d{1,2})?$/, { error: "Enter an amount like 350 or 350.00." })])
    .optional(),
  stockTrackingEnabled: z.boolean().default(true),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Enter your current password." }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "The new passwords don't match.",
    path: ["confirmPassword"],
  });

// --- Catalog (Phase 2) ---------------------------------------------------

const priceString = z
  .string()
  .trim()
  .min(1, { error: "Enter a price." })
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Price must be a number like 1200 or 1200.50." })
  .refine((v) => Number(v) >= 0, { error: "Price can't be negative." });

const stockInt = z.coerce
  .number({ error: "Enter a whole number." })
  .int({ error: "Stock must be a whole number." })
  .min(0, { error: "Stock can't be negative." })
  .max(1_000_000, { error: "That's a lot of stock — check the number." });

export const productSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(120),
  price: priceString,
  stockQty: stockInt,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  lowStockThreshold: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)])
    .optional(),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  storefrontHidden: z.boolean().optional().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustSchema = z.object({
  stockQty: stockInt,
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

// --- Order Desk (Phase 3) ---------------------------------------------

export const phoneSchema = z
  .string()
  .trim()
  .min(6, { error: "Enter a valid phone number." })
  .max(24)
  .regex(/^\+?[0-9\s-]+$/, { error: "Digits, spaces, and a leading + only." });

export const customerSchema = z.object({
  name: z.string().trim().min(1, { error: "Customer name is required." }).max(80),
  phone: phoneSchema,
});

const money2 = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter an amount like 250 or 250.50." });

export const orderDraftSchema = z.object({
  customerId: z.uuid().optional(),
  // Customer details are required to fulfil an order.
  customerName: z.string().trim().min(1, { error: "Customer name is required." }).max(80),
  customerPhone: phoneSchema,
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(100000),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .min(1, { error: "Add at least one item." }),
  deliveryFee: z.union([z.literal(""), money2]).optional(),
  discountType: z.enum(["none", "flat", "percent"]).default("none"),
  discountValue: z.union([z.literal(""), money2]).optional(),
  deliveryAddress: z
    .string()
    .trim()
    .min(5, { error: "Delivery address is required." })
    .max(500),
  courier: z.string().trim().max(80).optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]).default("unpaid"),
  amountPaid: z.union([z.literal(""), money2]).optional(),
  note: z.string().trim().max(2000).optional(),
  shareCode: z.string().trim().max(12).optional(),
  confirm: z.boolean().default(false),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled", "returned"]),
});
export const deliveryStatusUpdateSchema = z.object({
  deliveryStatus: z.enum(["pending", "dispatched", "delivered"]),
});

export const paymentUpdateSchema = z.object({
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  amountPaid: z.union([z.literal(""), money2]).optional(),
});

export type OrderDraftInput = z.infer<typeof orderDraftSchema>;

export const orderNoteSchema = z.object({
  note: z.string().trim().max(2000),
});

// --- Share link (Phase 4) -------------------------------------------

export const shareSettingsSchema = z.object({
  accentColor: z
    .union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Use a hex colour like #0f7b6c." })])
    .optional(),
  sharePolicyText: z.string().trim().max(500).optional().or(z.literal("")),
  whatsappNumber: z
    .string()
    .trim()
    .min(6, { error: "Enter a valid WhatsApp number." })
    .max(24)
    .regex(/^\+?[0-9\s-]+$/, { error: "Digits, spaces, and a leading + only." }),
  storefrontCategories: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  paused: z.boolean().default(false),
});

export const shareHandoffSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(100000),
      }),
    )
    .min(1, { error: "Add at least one item." }),
  note: z.string().trim().max(500).optional(),
  customerName: z.string().trim().min(1, { error: "Enter your name." }).max(80),
  customerPhone: phoneSchema,
  deliveryAddress: z
    .string()
    .trim()
    .min(5, { error: "Enter your delivery address." })
    .max(500),
});

/** Turns "Aisha's Kitchen" into "aishas-kitchen". */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "shop"
  );
}
