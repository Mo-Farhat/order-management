"use client";

import { useActionState } from "react";
import { saveBusinessSettings, changePassword, type SettingsState } from "@/app/actions/settings";
import { FormError } from "@/components/form";
import { SubmitBtn } from "@/components/desk/submit-btn";

function Note({ state }: { state: SettingsState }) {
  return (
    <>
      <FormError message={state?.error} />
      {state?.ok && <p className="text-xs text-accent">{state.ok}</p>}
    </>
  );
}

function LabeledInput({
  label,
  name,
  defaultValue,
  errors,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent aria-[invalid=true]:border-danger"
        aria-invalid={!!errors?.length}
        {...rest}
      />
      {hint && !errors?.length && <span className="text-xs text-muted">{hint}</span>}
      {errors?.map((e) => (
        <span key={e} className="text-xs text-danger">{e}</span>
      ))}
    </label>
  );
}

export function BusinessSettingsForm({
  name,
  slug,
  currency,
  deliveryFeeDefault,
  stockTrackingEnabled,
}: {
  name: string;
  slug: string;
  currency: string;
  deliveryFeeDefault: string;
  stockTrackingEnabled: boolean;
}) {
  const [state, action] = useActionState(saveBusinessSettings, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Note state={state} />
      <LabeledInput label="Business name" name="name" defaultValue={name} errors={state?.fieldErrors?.name} />

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          Storefront address
        </span>
        <span className="flex items-stretch rounded-lg border border-line bg-surface focus-within:border-accent">
          <span className="flex items-center pl-3 pr-1 text-base text-muted">/s/</span>
          <input
            name="slug"
            defaultValue={slug}
            spellCheck={false}
            autoCapitalize="none"
            className="w-full rounded-r-lg bg-transparent py-2.5 pr-3 text-base outline-none aria-[invalid=true]:text-danger"
            aria-invalid={!!state?.fieldErrors?.slug?.length}
          />
        </span>
        {state?.fieldErrors?.slug?.length ? (
          state.fieldErrors.slug.map((e) => (
            <span key={e} className="text-xs text-danger">{e}</span>
          ))
        ) : (
          <span className="text-xs text-warn">
            Changing this breaks your existing storefront link and QR code — you&apos;ll
            need to re-share them.
          </span>
        )}
      </label>

      <p className="text-xs text-muted">
        Your WhatsApp number moved to <span className="font-medium">Storefront</span>.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="Currency"
          name="currency"
          defaultValue={currency}
          maxLength={6}
          hint="e.g. LKR, USD"
          errors={state?.fieldErrors?.currency}
        />
        <LabeledInput
          label="Default delivery fee"
          name="deliveryFeeDefault"
          defaultValue={deliveryFeeDefault}
          inputMode="decimal"
          placeholder="0"
          hint="Pre-filled on new orders."
          errors={state?.fieldErrors?.deliveryFeeDefault}
        />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3">
        <span className="text-sm">
          <span className="font-medium">Track stock</span>
          <span className="block text-xs text-muted">
            Decrement quantities when orders are confirmed.
          </span>
        </span>
        <input
          type="checkbox"
          name="stockTrackingEnabled"
          defaultChecked={stockTrackingEnabled}
          className="size-5 accent-[var(--color-accent)]"
        />
      </label>
      <SubmitBtn className="self-start" pendingLabel="Saving…">Save</SubmitBtn>
    </form>
  );
}

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePassword, undefined);
  if (!hasPassword) {
    return (
      <p className="text-sm text-muted">
        This account signs in with a magic link, so there&apos;s no password to change.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Note state={state} />
      <LabeledInput
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        errors={state?.fieldErrors?.currentPassword}
      />
      <LabeledInput
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.newPassword}
      />
      <LabeledInput
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirmPassword}
      />
      <p className="text-xs text-muted">
        Changing your password signs out every other device.
      </p>
      <SubmitBtn className="self-start" pendingLabel="Saving…">Change password</SubmitBtn>
    </form>
  );
}
