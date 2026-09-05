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
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustSchema = z.object({
  stockQty: stockInt,
  note: z.string().trim().max(200).optional().or(z.literal("")),
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
