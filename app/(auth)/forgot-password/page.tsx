"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/password-reset";
import type { FormState } from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Check your email</h1>
        <p className="text-sm text-muted">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
          It expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm text-accent underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          errors={state?.fieldErrors?.email}
        />
        <SubmitButton>Send reset link</SubmitButton>
      </form>
      <p className="text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
