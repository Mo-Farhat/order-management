"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginWithPassword, type FormState } from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const justReset = searchParams.get("reset") === "1";
  const [state, action] = useActionState<FormState, FormData>(loginWithPassword, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-muted">Back to your order desk.</p>
      </div>

      {justReset && (
        <p className="rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
          Password updated. Log in with your new password.
        </p>
      )}

      <form action={action} className="flex flex-col gap-4">
        <FormError message={state?.error} />
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton>Log in</SubmitButton>
        <Link
          href="/forgot-password"
          className="self-start text-sm text-muted underline underline-offset-4"
        >
          Forgot your password?
        </Link>
      </form>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-4">
          Start free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
