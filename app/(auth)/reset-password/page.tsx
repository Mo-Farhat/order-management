"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/actions/password-reset";
import type { FormState } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit } from "@/components/auth/fields";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action] = useActionState<FormState, FormData>(resetPassword, undefined);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="mkt-serif text-[1.75rem] text-ink">Invalid link</h1>
        <p className="text-sm text-muted">This reset link is missing its token.</p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="mkt-serif text-[1.75rem] text-ink">Choose a new password</h1>
      <form action={action} className="flex flex-col gap-4">
        <AuthError message={state?.error} />
        <input type="hidden" name="token" value={token} />
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
          hint="At least 8 characters."
          errors={state?.fieldErrors?.password}
        />
        <AuthField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          errors={state?.fieldErrors?.confirmPassword}
        />
        <AuthSubmit>Set password</AuthSubmit>
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
