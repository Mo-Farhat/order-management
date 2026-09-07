"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type FormState } from "@/app/actions/auth";
import { AuthError, AuthField, AuthSubmit } from "@/components/auth/fields";

export default function SignupPage() {
  const [state, action] = useActionState<FormState, FormData>(signup, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mkt-serif text-[1.75rem] text-ink">Start free</h1>
        <p className="mt-1 text-sm text-muted">
          Your storefront and order desk, set up in minutes. No card needed.
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
          placeholder="you@business.lk"
          required
          autoFocus
          errors={state?.fieldErrors?.email}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          errors={state?.fieldErrors?.password}
        />
        <AuthSubmit>Create account</AuthSubmit>
      </form>

      <p className="text-xs leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="border-t border-line pt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
