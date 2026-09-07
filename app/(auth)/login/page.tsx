"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginWithPassword, type FormState } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthSubmit } from "@/components/auth/fields";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const justReset = searchParams.get("reset") === "1";
  const [state, action] = useActionState<FormState, FormData>(loginWithPassword, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mkt-serif text-[1.75rem] text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to your order desk.</p>
      </div>

      {justReset && (
        <AuthNotice>Password updated. Log in with your new password.</AuthNotice>
      )}

      <form action={action} className="flex flex-col gap-4">
        <AuthError message={state?.error} />
        <input type="hidden" name="next" value={next} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@business.lk"
          required
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Link
            href="/forgot-password"
            className="self-end text-xs text-muted underline underline-offset-4 hover:text-ink"
          >
            Forgot your password?
          </Link>
        </div>
        <AuthSubmit>Log in</AuthSubmit>
      </form>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent underline-offset-4 hover:underline">
          Create a free account
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
