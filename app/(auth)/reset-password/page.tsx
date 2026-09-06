"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/actions/password-reset";
import type { FormState } from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action] = useActionState<FormState, FormData>(resetPassword, undefined);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Invalid link</h1>
        <p className="text-sm text-muted">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="text-sm text-accent underline underline-offset-4">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium tracking-tight">Choose a new password</h1>
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <input type="hidden" name="token" value={token} />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          errors={state?.fieldErrors?.password}
        />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          errors={state?.fieldErrors?.confirmPassword}
        />
        <SubmitButton>Set password</SubmitButton>
      </form>
      <p className="text-xs text-muted">
        Changing your password signs out every other device.
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
