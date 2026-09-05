"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loginWithPassword,
  sendMagicLink,
  type FormState,
} from "@/app/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/form";

function LoginForms() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [mode, setMode] = useState<"password" | "link">("password");

  const [pwState, pwAction] = useActionState<FormState, FormData>(
    loginWithPassword,
    undefined,
  );
  const [linkState, linkAction] = useActionState<FormState, FormData>(
    sendMagicLink,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-muted">Back to your order desk.</p>
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="flex flex-col gap-4">
          <FormError message={pwState?.error} />
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <SubmitButton>Log in</SubmitButton>
          <button
            type="button"
            onClick={() => setMode("link")}
            className="self-start text-sm text-muted underline underline-offset-4"
          >
            Email me a link instead
          </button>
        </form>
      ) : (
        <form action={linkAction} className="flex flex-col gap-4">
          <FormError message={linkState?.error} />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            errors={linkState?.fieldErrors?.email}
          />
          <SubmitButton>Send link</SubmitButton>
          <button
            type="button"
            onClick={() => setMode("password")}
            className="self-start text-sm text-muted underline underline-offset-4"
          >
            Use a password instead
          </button>
        </form>
      )}

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
      <LoginForms />
    </Suspense>
  );
}
