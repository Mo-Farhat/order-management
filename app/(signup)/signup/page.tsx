"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup, type FormState } from "@/app/actions/auth";
import {
  AuthColorField,
  AuthError,
  AuthField,
  AuthSection,
  AuthSelect,
  AuthSubmit,
  AuthTextarea,
} from "@/components/auth/fields";

const CURRENCIES = [
  { value: "LKR", label: "LKR — Sri Lankan rupee" },
  { value: "USD", label: "USD — US dollar" },
  { value: "GBP", label: "GBP — Pound sterling" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "AUD", label: "AUD — Australian dollar" },
  { value: "INR", label: "INR — Indian rupee" },
];

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

/** Two equal columns from `sm` up, single column on phones. */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export default function SignupPage() {
  const [state, action] = useActionState<FormState, FormData>(signup, undefined);
  const [name, setName] = useState("");
  const [showStorefront, setShowStorefront] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mkt-serif text-[1.75rem] text-ink">Start free</h1>
        <p className="mt-1 text-sm text-muted">
          One form and your storefront is live. 14 days free, no card.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <AuthError message={state?.error} />

        <AuthSection title="Your account">
          <Row>
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
          </Row>
        </AuthSection>

        <AuthSection
          title="Your business"
          hint="This is what customers see. All of it is editable later."
        >
          <Row>
            <div className="flex flex-col gap-1.5">
              <AuthField
                label="Business name"
                name="businessName"
                autoComplete="organization"
                placeholder="Northgate Supply Co."
                required
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                errors={state?.fieldErrors?.businessName}
              />
              <p className="truncate text-xs text-muted">
                Link <span className="font-mono text-ink">/s/{previewSlug(name.trim())}</span>
              </p>
            </div>
            <AuthField
              label="WhatsApp number"
              name="whatsappNumber"
              inputMode="tel"
              autoComplete="tel"
              placeholder="077 123 4567"
              required
              maxLength={24}
              hint="Where storefront orders reach you."
              errors={state?.fieldErrors?.whatsappNumber}
            />
          </Row>
          <Row>
            <AuthField
              label="Instagram (optional)"
              name="instagramHandle"
              placeholder="northgatesupply"
              maxLength={30}
              hint="Lets customers order via your DMs too."
              errors={state?.fieldErrors?.instagramHandle}
            />
            <AuthSelect
              label="Currency"
              name="currency"
              options={CURRENCIES}
              defaultValue="LKR"
            />
          </Row>
        </AuthSection>

        <AuthSection title="Your storefront" hint="Optional — sensible defaults are already set.">
          {showStorefront ? (
            <Row>
              <AuthColorField
                label="Accent colour"
                name="accentColor"
                hint="Buttons and highlights on your public page."
              />
              <AuthTextarea
                label="Delivery & payment note"
                name="sharePolicyText"
                rows={2}
                maxLength={500}
                placeholder="Island-wide delivery in 2–3 days. Bank transfer or cash on delivery."
                errors={state?.fieldErrors?.sharePolicyText}
              />
            </Row>
          ) : (
            <button
              type="button"
              onClick={() => setShowStorefront(true)}
              className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Customise colour and delivery note
            </button>
          )}
        </AuthSection>

        <AuthSubmit>Create my storefront</AuthSubmit>
      </form>

      <div className="flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="shrink-0">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
