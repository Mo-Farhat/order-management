"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";

type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  autoFocus?: boolean;
  errors?: string[];
  hint?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

/** Marketing-themed text field. Password fields get a show/hide toggle. */
export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  defaultValue,
  required,
  autoFocus,
  errors,
  hint,
  maxLength,
  onChange,
}: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const invalid = !!errors?.length;
  const describedBy = invalid ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="mkt-eyebrow text-[11px] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && reveal ? "text" : type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          autoFocus={autoFocus}
          maxLength={maxLength}
          onChange={onChange}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`mkt-input ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-ink"
            tabIndex={-1}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {invalid ? (
        <p id={`${id}-err`} className="text-xs text-[#b3402f]">
          {errors![0]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="mkt-btn mkt-btn-primary mt-1 h-12 w-full text-[12px] uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "One moment…" : children}
    </button>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-[#b3402f]/30 bg-[#b3402f]/10 px-3 py-2 text-sm text-[#b3402f]"
    >
      {message}
    </p>
  );
}

export function AuthNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-accent/25 bg-accent-weak px-3 py-2 text-sm text-accent">
      {children}
    </p>
  );
}
