"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type FormState } from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

export default function SignupPage() {
  const [state, action] = useActionState<FormState, FormData>(signup, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Start free</h1>
        <p className="mt-1 text-sm text-muted">
          Your DMs stop being your order book. 14 days free, no card.
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
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          errors={state?.fieldErrors?.password}
        />
        <SubmitButton>Create account</SubmitButton>
      </form>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
