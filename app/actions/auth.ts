"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { ZodError } from "zod";

import { signIn } from "@/auth";
import { db } from "@/db";
import { pooledDb } from "@/db/tenant";
import { auditLog, memberships, tenants, users } from "@/db/schema";
import { signupWithBusinessSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import { resolveSlug, trialEndsAt } from "@/lib/provisioning";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: string;
} | undefined;

/** A thrown value that is really a Next redirect, not an error. */
function isRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * One-shot signup: account + business + storefront presentation.
 *
 * Everything is created in a single transaction *before* the user is signed
 * in, so the JWT picks up `tenantId` on the initial sign-in and the user lands
 * straight in the desk. There is no second step to get stuck on.
 */
export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupWithBusinessSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
    whatsappNumber: formData.get("whatsappNumber"),
    instagramHandle: formData.get("instagramHandle") ?? "",
    currency: formData.get("currency") ?? "LKR",
    accentColor: formData.get("accentColor") ?? "",
    sharePolicyText: formData.get("sharePolicyText") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: z2fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const whatsappNumber = normalizePhone(parsed.data.whatsappNumber);
  if (!whatsappNumber || whatsappNumber.replace(/\D/g, "").length < 9) {
    return {
      fieldErrors: {
        whatsappNumber: [
          "That doesn't look like a valid mobile number. Enter it like 077 123 4567 or +94 77 123 4567.",
        ],
      },
    };
  }

  const password = parsed.data.password;

  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return {
        fieldErrors: {
          email: ["An account with that email already exists. Try logging in."],
        },
      };
    }

    const hashedPassword = await hashPassword(password);
    const slug = await resolveSlug(parsed.data.businessName);

    // neon-http has no transactions; the pooled (WebSocket) client does. Either
    // the whole workspace is created or none of it is.
    await pooledDb().transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email, hashedPassword, passwordChangedAt: new Date() })
        .returning({ id: users.id });
      if (!user) throw new Error("user insert returned no row");

      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: parsed.data.businessName,
          slug,
          whatsappNumber,
          instagramHandle: parsed.data.instagramHandle || null,
          currency: parsed.data.currency,
          accentColor: parsed.data.accentColor || null,
          sharePolicyText: parsed.data.sharePolicyText || null,
          trialEndsAt: trialEndsAt(),
        })
        .returning({ id: tenants.id });
      if (!tenant) throw new Error("tenant insert returned no row");

      await tx.insert(memberships).values({
        userId: user.id,
        tenantId: tenant.id,
        role: "owner",
      });

      await tx.insert(auditLog).values({
        tenantId: tenant.id,
        actorUserId: user.id,
        action: "tenant.created",
        entity: "tenant",
        entityId: tenant.id,
        after: { name: parsed.data.businessName, slug },
      });
    });
  } catch (err) {
    console.error("[signup] could not create account", err);
    return {
      error: "Something went wrong creating your account. Please try again in a moment.",
    };
  }

  // Sign in and go straight to the desk. If the auto sign-in hiccups, fall back
  // to the login screen rather than a 500 — the account already exists.
  try {
    await signIn("credentials", { email, password, redirectTo: "/desk" });
  } catch (err) {
    if (isRedirect(err)) throw err;
    console.error("[signup] auto sign-in failed", err);
    redirect("/login?created=1");
  }
}

/** Only allow same-origin relative paths as a post-login destination. */
function safeNext(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/desk";
  }
  return raw;
}

export async function loginWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email or password is incorrect." };
    }
    throw err;
  }
}

function z2fieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
