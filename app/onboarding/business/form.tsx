"use client";

import { useActionState, useEffect, useState } from "react";
import { saveBusinessBasics } from "@/app/actions/onboarding";
import { signOutAction } from "@/app/actions/session";
import type { FormState } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { Field, FormError, SubmitButton } from "@/components/form";

// Mirrors lib/validation#slugify closely enough for a live preview; the server
// computes the real (collision-checked) slug on submit.
function previewSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "your-shop"
  );
}

export function BusinessBasicsForm({ email }: { email: string }) {
  const [state, action] = useActionState<FormState, FormData>(
    saveBusinessBasics,
    undefined,
  );
  const [name, setName] = useState("");

  // On success the action returns { ok: "/desk" } instead of redirecting, so we
  // navigate with a full page load — that guarantees the refreshed session
  // cookie is sent before the next request reaches route protection.
  useEffect(() => {
    if (state?.ok) window.location.href = state.ok;
  }, [state]);

  const slug = previewSlug(name.trim());

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
          {APP_NAME} · Setup · Step 2 of 2
        </p>
        <h1 className="text-2xl font-medium tracking-tight">Set up your business</h1>
        <p className="mt-1 text-sm text-muted">
          Just two things and your workspace is ready. You can change both later
          in Settings.
        </p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <FormError message={state?.error} />

          <div>
            <Field
              label="Business name"
              name="name"
              required
              maxLength={80}
              autoComplete="organization"
              placeholder="Northgate Supply Co."
              hint="Shown to customers on your storefront and order messages."
              errors={state?.fieldErrors?.name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">
              Storefront link:{" "}
              <span className="font-mono text-ink">/s/{slug}</span>
              <span className="text-muted">
                {" "}
                — we pick a free one; you can customise it later.
              </span>
            </p>
          </div>

          <Field
            label="WhatsApp number"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            required
            maxLength={24}
            autoComplete="tel"
            placeholder="077 123 4567"
            hint="Where storefront orders reach you. Local (077…) or full (+94 77…) both work. Add Instagram later in Settings."
            errors={state?.fieldErrors?.whatsappNumber}
          />

          <SubmitButton>Continue</SubmitButton>
        </form>

        <div className="mt-6 border-t border-line pt-4 text-xs text-muted">
          Signed in as <span className="text-ink">{email}</span>.{" "}
          <form action={signOutAction} className="inline">
            <button
              type="submit"
              className="text-ink underline underline-offset-4 hover:no-underline"
            >
              Use a different account
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
