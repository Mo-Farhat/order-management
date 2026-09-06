import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Shared "packaging" for every desk screen — consistent headers, cards, tables,
 * buttons and stat tiles so the app reads as one dashboard, not a pile of pages. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  icon,
  actions,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(20,32,29,0.04)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {icon && <span className="text-muted">{icon}</span>}
            {title}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "default" | "accent" | "warn" | "danger";
}) {
  const toneCls = {
    default: "",
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger",
  }[tone];
  const inner = (
    <>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls =
    "block rounded-xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(20,32,29,0.04)]";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-accent/50`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

type BtnProps = {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
};

function btnCls({ variant = "primary", size = "md" }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-mono font-semibold uppercase tracking-widest transition-colors disabled:opacity-40";
  const sizes = { sm: "h-8 px-3 text-[10px]", md: "h-10 px-4 text-[11px]" };
  const variants = {
    primary: "bg-accent text-accent-fg hover:bg-accent/90",
    outline: "border border-line bg-card text-ink hover:border-accent/50",
    ghost: "text-muted hover:text-ink",
    danger: "border border-danger/40 text-danger hover:bg-danger/10",
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

export function BtnLink({
  variant,
  size,
  children,
  ...rest
}: BtnProps & ComponentProps<typeof Link>) {
  return (
    <Link className={btnCls({ variant, size, children })} {...rest}>
      {children}
    </Link>
  );
}

export function Btn({
  variant,
  size,
  children,
  className = "",
  ...rest
}: BtnProps & ComponentProps<"button"> & { className?: string }) {
  return (
    <button className={`${btnCls({ variant, size, children })} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function EmptyState({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-card px-6 py-12 text-center text-sm text-muted">
      {title && <p className="text-base font-semibold text-ink">{title}</p>}
      <div className="max-w-sm">{children}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* Table helpers — use as: <Table><THead>…</THead><tbody>…</tbody></Table> */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-muted ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
