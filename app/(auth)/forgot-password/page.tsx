"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/password-reset";
import type { FormState } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit } from "@/components/auth/fields";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="mkt-serif text-[1.75rem] text-ink">Check your email</h1>
        <p className="text-sm text-muted">
          If an account exists for that address, we&apos;ve sent a link to reset your
          password. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mkt-serif text-[1.75rem] text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <AuthError message={state?.error} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@yourbusiness.com"
          required
          autoFocus
          errors={state?.fieldErrors?.email}
        />
        <AuthSubmit>Send reset link</AuthSubmit>
      </form>
      <p className="border-t border-line pt-4 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
