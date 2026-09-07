"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { ZodError } from "zod";

import { signIn } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signupSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

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

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z2fieldErrors(parsed.error) };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return { error: "An account with that email already exists. Try logging in." };
    }

    const hashedPassword = await hashPassword(parsed.data.password);
    await db.insert(users).values({
      email,
      hashedPassword,
      passwordChangedAt: new Date(),
    });
  } catch (err) {
    console.error("[signup] could not create account", err);
    return {
      error: "Something went wrong creating your account. Please try again in a moment.",
    };
  }

  // Sign the new user in and send them to onboarding. If the auto sign-in
  // hiccups (it occasionally does on the edge), fall back to the login screen
  // rather than a 500 — the account already exists.
  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/onboarding/business",
    });
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
