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
