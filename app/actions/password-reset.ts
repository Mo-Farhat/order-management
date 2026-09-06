"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

function z2fieldErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: z2fieldErrors(parsed.error) };

  const limit = await rateLimit(`pwreset:${await clientIp()}`, 5, 15 * 60);
  if (!limit.ok) {
    return { error: "Too many requests. Try again in a few minutes." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Only send if the account exists AND uses a password. Always return the same
  // success state either way so we don't leak which emails are registered.
  if (user?.hashedPassword) {
    const token = randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const url = `${await originFromHeaders()}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(email, url);
    } catch {
      /* swallow — don't reveal send failures to the caller */
    }
  }

  return { ok: "sent" };
}

export async function resetPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: z2fieldErrors(parsed.error) };

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, hash(parsed.data.token)),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date()),
    ),
  });
  if (!row) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await db
    .update(users)
    .set({ hashedPassword, passwordChangedAt: new Date() })
    .where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  redirect("/login?reset=1");
}
