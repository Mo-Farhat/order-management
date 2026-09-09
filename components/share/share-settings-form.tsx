"use client";

import { useActionState, useState, type ReactNode } from "react";
import { saveShareSettings } from "@/app/actions/share";
import { FormError } from "@/components/form";
import { SubmitBtn } from "@/components/desk/submit-btn";
import {
  FONT_CHOICES,
  SORT_KEYS,
  type BgTone,
  type FontChoice,
  type SortKey,
  type StorefrontConfig,
} from "@/lib/validation";
import {
  tierAllows,
  tierFor,
  type StorefrontFeature,
} from "@/lib/entitlements";
import type { PlanTier } from "@/db/schema";

const BG_TONE_LABELS: Record<BgTone, string> = {
  default: "Default",
  warm: "Warm",
  cool: "Cool",
  contrast: "High contrast",
};
const FONT_LABELS: Record<FontChoice, string> = {
  sans: "Sans (default)",
  serif: "Serif",
  rounded: "Rounded",
  mono: "Mono",
};
const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};
const TIER_LABEL: Record<PlanTier, string> = { basic: "Basic", studio: "Studio", pro: "Pro" };

const label =
  "font-mono text-[11px] font-semibold uppercase tracking-widest text-muted";

/** Renders children as-is when the tier allows the feature, else greyed with a tier pill. */
function Locked({
  tier,
  feature,
  children,
}: {
  tier: PlanTier;
  feature: StorefrontFeature;
  children: ReactNode;
}) {
  if (tierAllows(tier, feature)) return <>{children}</>;
  return (
    <div className="pointer-events-none opacity-50">
      <div className="mb-1">
        <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          ✦ {TIER_LABEL[tierFor(feature)]}
        </span>
      </div>
      {children}
    </div>
  );
}

export function ShareSettingsForm({
  whatsappNumber,
  instagramHandle,
  accentColor,
  sharePolicyText,
  paused,
  allCategories,
  chosenCategories,
  tier,
  config,
  logoUrl,
  bannerUrl,
  storageEnabled,
}: {
  whatsappNumber: string;
  instagramHandle: string;
  accentColor: string | null;
  sharePolicyText: string | null;
  paused: boolean;
  allCategories: string[];
  chosenCategories: string[] | null;
  tier: PlanTier;
  config: StorefrontConfig;
  logoUrl: string | null;
  bannerUrl: string | null;
  storageEnabled: boolean;
}) {
  const [state, action] = useActionState(saveShareSettings, undefined);
  const [color, setColor] = useState(accentColor || "#1e40af");
  const [cfg, setCfg] = useState<StorefrontConfig>(config ?? {});

  const [order, setOrder] = useState<string[]>(
    chosenCategories === null
      ? allCategories
      : chosenCategories.filter((c) => allCategories.includes(c)),
  );
  const unused = allCategories.filter((c) => !order.includes(c));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const set = (patch: Partial<StorefrontConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const sections = cfg.sections ?? {};
  const setSection = (k: keyof NonNullable<StorefrontConfig["sections"]>, v: boolean) =>
    setCfg((c) => ({ ...c, sections: { ...c.sections, [k]: v } }));

  return (
    <form action={action} className="flex flex-col gap-6">
      <FormError message={state?.error} />
      {state?.ok && <p className="text-xs text-accent">{state.ok}</p>}

      <input type="hidden" name="storefrontConfig" value={JSON.stringify(cfg)} />

      {/* Live toggle */}
      <label className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-3">
        <span className="text-sm">
          <span className="font-medium">Page is live</span>
          <span className="block text-xs text-muted">
            Turn off to show visitors a &ldquo;not taking orders&rdquo; message.
          </span>
        </span>
        <input
          type="checkbox"
          name="paused"
          defaultChecked={paused}
          className="size-5 accent-[var(--color-danger)]"
        />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">paused</span>
      </label>

      {/* Contact */}
      <fieldset className="flex flex-col gap-3">
        <legend className={label}>Contact</legend>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">WhatsApp number — storefront orders are sent here</span>
          <input
            name="whatsappNumber"
            defaultValue={whatsappNumber}
            inputMode="tel"
            placeholder="+15551234567"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent sm:w-56"
          />
          {state?.fieldErrors?.whatsappNumber?.map((m) => (
            <span key={m} className="text-xs text-danger">{m}</span>
          ))}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Instagram handle</span>
          <input
            name="instagramHandle"
            defaultValue={instagramHandle}
            placeholder="yourshop"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent sm:w-56"
          />
          {state?.fieldErrors?.instagramHandle?.map((m) => (
            <span key={m} className="text-xs text-danger">{m}</span>
          ))}
        </label>
      </fieldset>

      {/* Branding */}
      <fieldset className="flex flex-col gap-4">
        <legend className={label}>Branding</legend>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Logo</span>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-14 rounded-lg border border-line object-cover" />
          )}
          {storageEnabled ? (
            <>
              <input type="file" name="logo" accept="image/jpeg,image/png,image/webp" className="text-xs" />
              {logoUrl && (
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="removeLogo" /> Remove current logo
                </label>
              )}
            </>
          ) : (
            <span className="text-xs text-muted">Image storage isn&apos;t configured.</span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Accent colour</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 rounded-lg border border-line bg-surface"
            />
            <input
              name="accentColor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-32 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
            />
          </div>
          {state?.fieldErrors?.accentColor?.map((m) => (
            <span key={m} className="text-xs text-danger">{m}</span>
          ))}
        </label>

        <Locked tier={tier} feature="onAccentColor">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Text on the accent (blank = auto contrast)</span>
            <input
              value={cfg.onAccentColor ?? ""}
              onChange={(e) => set({ onAccentColor: e.target.value })}
              placeholder="#ffffff"
              className="h-10 w-32 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
        </Locked>

        <Locked tier={tier} feature="bannerImage">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Banner image (wide, shown above the catalog)</span>
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="aspect-[3/1] w-full max-w-sm rounded-lg border border-line object-cover" />
            )}
            {storageEnabled && (
              <>
                <input type="file" name="banner" accept="image/jpeg,image/png,image/webp" className="text-xs" />
                {bannerUrl && (
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" name="removeBanner" /> Remove current banner
                  </label>
                )}
              </>
            )}
          </div>
        </Locked>

        <Locked tier={tier} feature="secondaryColor">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Secondary colour</span>
            <input
              value={cfg.secondaryColor ?? ""}
              onChange={(e) => set({ secondaryColor: e.target.value })}
              placeholder="#475569"
              className="h-10 w-32 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
        </Locked>

        <Locked tier={tier} feature="bgTone">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Background tone</span>
            <select
              value={cfg.bgTone ?? "default"}
              onChange={(e) => set({ bgTone: e.target.value as BgTone })}
              className="h-10 w-48 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
            >
              {(Object.keys(BG_TONE_LABELS) as BgTone[]).map((t) => (
                <option key={t} value={t}>{BG_TONE_LABELS[t]}</option>
              ))}
            </select>
          </label>
        </Locked>

        <Locked tier={tier} feature="fontChoice">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Font</span>
            <select
              value={cfg.font ?? "sans"}
              onChange={(e) => set({ font: e.target.value as FontChoice })}
              className="h-10 w-48 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
            >
              {FONT_CHOICES.map((f) => (
                <option key={f} value={f}>{FONT_LABELS[f]}</option>
              ))}
            </select>
          </label>
        </Locked>
      </fieldset>

      {/* Content */}
      <fieldset className="flex flex-col gap-4">
        <legend className={label}>Content</legend>
        <Locked tier={tier} feature="tagline">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Tagline (under the shop name / in the masthead)</span>
            <input
              value={cfg.tagline ?? ""}
              maxLength={120}
              onChange={(e) => set({ tagline: e.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
            />
          </label>
        </Locked>
        <Locked tier={tier} feature="heroCopy">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Masthead headline</span>
              <input
                value={cfg.heroTitle ?? ""}
                maxLength={80}
                onChange={(e) => set({ heroTitle: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Masthead subhead</span>
              <input
                value={cfg.heroSubtitle ?? ""}
                maxLength={160}
                onChange={(e) => set({ heroSubtitle: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
        </Locked>
      </fieldset>

      {/* Layout */}
      <fieldset className="flex flex-col gap-4">
        <legend className={label}>Layout</legend>
        <Locked tier={tier} feature="defaultSort">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Default product sort</span>
            <select
              value={cfg.defaultSort ?? "newest"}
              onChange={(e) => set({ defaultSort: e.target.value as SortKey })}
              className="h-10 w-56 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </label>
        </Locked>
        <Locked tier={tier} feature="sectionToggles">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted">Show / hide sections</span>
            {([
              ["banner", "Masthead / banner"],
              ["policyNote", "Policy note in the footer"],
              ["categoryNav", "Category navigation"],
            ] as const).map(([k, txt]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sections[k] !== false}
                  onChange={(e) => setSection(k, e.target.checked)}
                />
                {txt}
              </label>
            ))}
          </div>
        </Locked>
        <Locked tier={tier} feature="removePoweredBy">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sections.poweredBy !== false}
              onChange={(e) => setSection("poweredBy", e.target.checked)}
            />
            Show &ldquo;powered by&rdquo; in the footer
          </label>
        </Locked>
      </fieldset>

      {/* Categories */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className={label}>Category navigation</legend>
        <span className="text-xs text-muted">
          The filter links in your storefront nav, in this order. Names must match a
          product&apos;s category.
        </span>
        <input type="hidden" name="storefrontCategories" value={JSON.stringify(order)} />
        {allCategories.length === 0 ? (
          <p className="text-xs text-muted">Add a category to a product first.</p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {order.map((c, i) => (
                <li key={c} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="flex-1">{c}</span>
                  <button type="button" onClick={() => move(i, -1)} className="size-6 rounded border border-line text-xs disabled:opacity-30" disabled={i === 0}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="size-6 rounded border border-line text-xs disabled:opacity-30" disabled={i === order.length - 1}>↓</button>
                  <button type="button" onClick={() => setOrder(order.filter((x) => x !== c))} className="text-xs text-danger">remove</button>
                </li>
              ))}
              {order.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted">No links — the storefront shows every category.</li>
              )}
            </ul>
            {unused.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {unused.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOrder([...order, c])}
                    className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-accent/50"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </fieldset>

      {/* Policy */}
      <label className="flex flex-col gap-1.5">
        <span className={label}>Delivery / policy note</span>
        <textarea
          name="sharePolicyText"
          defaultValue={sharePolicyText ?? ""}
          rows={3}
          maxLength={500}
          placeholder="e.g. Local delivery within 2 days. Cash or bank transfer."
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <SubmitBtn className="self-start" pendingLabel="Saving…">Save settings</SubmitBtn>
    </form>
  );
}
