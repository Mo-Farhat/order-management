"use client";

import { useActionState } from "react";
import { saveBusinessBasics } from "@/app/actions/onboarding";
import type { FormState } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { Field, FormError, SubmitButton } from "@/components/form";

export default function BusinessBasicsPage() {
  const [state, action] = useActionState<FormState, FormData>(
    saveBusinessBasics,
    undefined,
  );

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {APP_NAME} · Setup
        </p>
        <h1 className="text-2xl font-medium tracking-tight">Your business</h1>
        <p className="mt-1 text-sm text-muted">
          Two details, then you&apos;re in. You can change both later.
        </p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <FormError message={state?.error} />
          <Field
            label="Business name"
            name="name"
            required
            placeholder="Aisha's Kitchen"
            hint="Becomes your storefront address — we'll pick a free one for you."
            errors={state?.fieldErrors?.name}
          />
          <Field
            label="WhatsApp number"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            required
            placeholder="+94 77 123 4567"
            hint="Where storefront orders are sent. You can add Instagram later."
            errors={state?.fieldErrors?.whatsappNumber}
          />
          <SubmitButton>Continue</SubmitButton>
        </form>
      </div>
    </main>
  );
}
