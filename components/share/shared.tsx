"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { StorefrontTenant } from "@/lib/share";

export function accentVars(tenant: Pick<StorefrontTenant, "accentColor">): CSSProperties {
  return { "--sf-accent": tenant.accentColor || "#0f7b6c" } as CSSProperties;
}

export function StorefrontHeader({
  tenant,
  backHref,
}: {
  tenant: StorefrontTenant;
  backHref?: string;
}) {
  return (
    <header className="flex items-center gap-3">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back to shop"
          className="flex size-8 items-center justify-center rounded-full border border-line text-sm"
        >
          ←
        </Link>
      )}
      {tenant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logoUrl} alt="" className="size-12 rounded-xl object-cover" />
      ) : (
        <span
          className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ background: "var(--sf-accent)" }}
        >
          {tenant.name.charAt(0)}
        </span>
      )}
      <div>
        <h1 className="text-lg font-semibold">{tenant.name}</h1>
        <p className="text-xs text-muted">Browse and send your order on WhatsApp</p>
      </div>
    </header>
  );
}

export function Step({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-lg border border-line text-sm"
    >
      {children}
    </button>
  );
}

export function Placeholder() {
  return (
    <div className="flex size-full items-center justify-center bg-surface font-mono text-[10px] text-muted">
      no photo
    </div>
  );
}
