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

export function AuthTextarea({
  label,
  name,
  placeholder,
  rows = 3,
  maxLength,
  hint,
  errors,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  hint?: string;
  errors?: string[];
}) {
  const id = useId();
  const invalid = !!errors?.length;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="mkt-eyebrow text-[11px] text-muted">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        className="mkt-input resize-y"
      />
      {invalid ? (
        <p className="text-xs text-[#b3402f]">{errors![0]}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Section divider inside a long auth form. */
export function AuthSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 border-t border-line pt-4 first:border-0 first:pt-0">
      <div>
        <h2 className="mkt-eyebrow text-[10px] text-accent">{title}</h2>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function AuthSelect({
  label,
  name,
  options,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="mkt-eyebrow text-[11px] text-muted">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="mkt-input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const SWATCHES = ["#0e1116", "#1e40af", "#0f766e", "#b91c1c", "#7c3aed", "#c2410c"];

/** Storefront accent colour: preset swatches plus a free colour picker. */
export function AuthColorField({
  label,
  name,
  defaultValue = "#0e1116",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [color, setColor] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="mkt-eyebrow text-[11px] text-muted">{label}</span>
      <input type="hidden" name={name} value={color} />
      <div className="flex items-center gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Use ${c}`}
            aria-pressed={color.toLowerCase() === c}
            className={`size-7 rounded-md border-2 transition-transform hover:scale-110 ${
              color.toLowerCase() === c ? "border-ink" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-7 cursor-pointer rounded-md border border-line bg-transparent p-0.5"
          />
          Custom
        </label>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
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
