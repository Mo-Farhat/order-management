"use client";

import { useActionState, useEffect, useState } from "react";
import { saveBusinessBasics } from "@/app/actions/onboarding";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthError, AuthField, AuthSubmit } from "@/components/auth/fields";
import type { FormState } from "@/app/actions/auth";

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
    <div className="flex flex-col gap-6">
      <div>
        <p className="mkt-eyebrow text-[10px] text-muted">Step 2 of 2</p>
        <h1 className="mkt-serif mt-1.5 text-[1.75rem] text-ink">Set up your business</h1>
        <p className="mt-1 text-sm text-muted">
          Two details and your workspace is ready.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <AuthError message={state?.error} />

        <div className="flex flex-col gap-1.5">
          <AuthField
            label="Business name"
            name="name"
            autoComplete="organization"
            placeholder="Northgate Supply Co."
            required
            autoFocus
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            errors={state?.fieldErrors?.name}
          />
          <p className="text-xs text-muted">
            Storefront link <span className="font-mono text-ink">/s/{slug}</span> — we
            pick a free one; customise it later.
          </p>
        </div>

        <AuthField
          label="WhatsApp number"
          name="whatsappNumber"
          type="text"
          inputMode="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          required
          maxLength={24}
          hint="Where storefront orders reach you. Local (077…) or +94 77… both work."
          errors={state?.fieldErrors?.whatsappNumber}
        />

        <AuthSubmit>Continue</AuthSubmit>
      </form>

      <div className="border-t border-line pt-4 text-xs text-muted">
        Signed in as <span className="text-ink">{email}</span>.{" "}
        <LogoutButton className="font-medium text-accent underline-offset-4 hover:underline">
          Use a different account
        </LogoutButton>
      </div>
    </div>
  );
}
