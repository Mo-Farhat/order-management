"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/desk/ui";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  required,
  inputMode,
  errors,
  hint,
  maxLength,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
  errors?: string[];
  hint?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={onChange}
        aria-invalid={errors && errors.length > 0}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-ink aria-[invalid=true]:border-danger"
      />
      {hint && !errors?.length && <span className="text-xs text-muted">{hint}</span>}
      {errors?.map((e) => (
        <span key={e} className="text-xs text-danger">
          {e}
        </span>
      ))}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 font-mono text-xs font-semibold uppercase tracking-widest text-accent-fg transition-opacity disabled:opacity-50"
    >
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}
