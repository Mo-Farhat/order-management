"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { ZodError } from "zod";

import { signIn } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signupSchema } from "@/lib/validation";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: string;
} | undefined;

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z2fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: "An account with that email already exists. Try logging in." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await db.insert(users).values({
    email,
    hashedPassword,
    passwordChangedAt: new Date(),
  });

  // signIn throws a redirect on success.
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/onboarding/business",
  });
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
