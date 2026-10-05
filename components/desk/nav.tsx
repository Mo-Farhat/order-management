"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  Upload,
  Store,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { APP_NAME } from "@/lib/constants";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type Group = { heading?: string; items: Item[] };

const GROUPS: Group[] = [
  {
    items: [
      { href: "/desk", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/desk/orders", label: "Orders", icon: ReceiptText },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/desk/catalog", label: "Products", icon: Package, exact: true },
      { href: "/desk/catalog/import", label: "Import CSV", icon: Upload },
    ],
  },
  {
    heading: "Storefront",
    items: [{ href: "/desk/share", label: "Storefront", icon: Store }],
  },
  {
    heading: "Account",
    items: [{ href: "/desk/settings", label: "Settings", icon: Settings }],
  },
];

function isActive(pathname: string, item: Item) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavList({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  const pathname = usePathname();
  const groups: Group[] = isAdmin
    ? [
        ...GROUPS,
        { heading: "Operator", items: [{ href: "/admin", label: "Platform admin", icon: ShieldCheck }] },
      ]
    : GROUPS;

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {groups.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {g.heading && (
            <p className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              {g.heading}
            </p>
          )}
          {g.items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-active text-sidebar-active-fg"
                    : "text-sidebar-fg hover:bg-black/[0.04]"
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={2}
                  className={active ? "" : "text-sidebar-muted"}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center border-b border-line px-4 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lockup-allcaps.svg" alt={APP_NAME} className="h-6 w-auto" />
    </div>
  );
}

function SidebarFooter({ email, role }: { email?: string; role?: string }) {
  return (
    <div className="border-t border-line px-3 py-3">
      {email && (
        <p className="truncate px-3 pb-2 text-xs text-sidebar-muted">
          {email}
          {role ? ` · ${role}` : ""}
        </p>
      )}
      <LogoutButton className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-fg transition-colors hover:bg-black/[0.04] disabled:opacity-60">
        <LogOut size={17} strokeWidth={2} className="text-sidebar-muted" />
        Log out
      </LogoutButton>
    </div>
  );
}

export function DesktopSidebar({
  isAdmin,
  email,
  role,
}: {
  isAdmin?: boolean;
  email?: string;
  role?: string;
}) {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-line bg-sidebar md:flex">
      <SidebarBrand />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavList isAdmin={isAdmin} />
      </div>
      <SidebarFooter email={email} role={role} />
    </aside>
  );
}

export function MobileNav({
  isAdmin,
  email,
  role,
}: {
  isAdmin?: boolean;
  email?: string;
  role?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-line md:hidden"
      >
        <Menu size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-sidebar">
            <SidebarBrand />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
            </div>
            <SidebarFooter email={email} role={role} />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Phone-only bottom tab bar for the five screens a seller lives in. Sits at
 * the foot of the desk's flex column (not `fixed`), so the scroll area and any
 * sticky bottom bars inside it end right above it. Hidden while composing an
 * order — that screen has its own sticky action bar and needs the room.
 */
const TABS: Item[] = [
  { href: "/desk", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/desk/orders", label: "Orders", icon: ReceiptText },
  { href: "/desk/orders/new", label: "New", icon: Plus },
  { href: "/desk/catalog", label: "Products", icon: Package },
  { href: "/desk/share", label: "Storefront", icon: Store },
];

export function MobileTabBar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  if (/^\/desk\/orders\/(new|[^/]+\/edit)/.test(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="grid shrink-0 grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const isNew = t.href === "/desk/orders/new";
        const active = !isNew && isActive(pathname, t);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            {isNew ? (
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
                <Icon size={18} strokeWidth={2.5} />
              </span>
            ) : (
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                {t.href === "/desk/orders" && pendingCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
            )}
            <span className="max-w-full truncate px-0.5">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const CRUMB_LABELS: Record<string, string> = {
  desk: "Dashboard",
  orders: "Orders",
  catalog: "Catalog",
  share: "Storefront",
  settings: "Settings",
  import: "Import",
  new: "New",
  edit: "Edit",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label =
      CRUMB_LABELS[part] ??
      (part.length > 12 ? part.slice(0, 8) + "…" : part.replace(/-/g, " "));
    return { href, label };
  });
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-ink">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-ink">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
