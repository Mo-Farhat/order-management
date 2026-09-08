# SFDesk design system — how to build on-brand

**This system ships design tokens + one Tailwind stylesheet. There are no
components** — `window.SFDeskUI` is empty; ignore any component-loading
instructions further down this file. Build with plain HTML elements and the
utility classes below; `styles.css` already contains a broad Tailwind v4 surface
plus the palette, so you do not run Tailwind yourself.

SFDesk (a.k.a. Storefront Desk) is a light-mode order-and-catalog app for
sellers who take orders over Instagram / WhatsApp DMs.

## Two palettes, switched by a class

The tokens are defined twice. **Default (no wrapper class) = the desk palette:**
orange accent (`#ea580c`), warm-grey neutrals, IBM Plex Sans. **Wrap a subtree
in `class="mkt"`** (marketing) **or `class="sf-theme"`** (public storefront) to
switch it to the **customer-facing palette**: blue accent (`#1e40af`), amber
secondary (`#f59e0b`), cooler neutrals, and the type changes to Spline Sans body
+ Geist headings. Every token re-points for that subtree, so the *same* utility
classes (`bg-accent`, `text-muted`, `border-line`, …) render in the other
palette. Pick the palette by audience: desk/admin screens = default; anything a
shop's customer sees = `.mkt` / `.sf-theme`.

Setup: link `styles.css` — it `@import`s the fonts (Google Fonts) and carries
everything else. No provider, no JS.

## Styling idiom: Tailwind CSS v4 utilities

No CSS-in-JS, no component props. The palette is exposed as color utilities via
`@theme`, so `bg-<t>`, `text-<t>`, `border-<t>`, `divide-<t>`, `ring-<t>` all
work for every token `<t>`:

| Utility | Use for |
|---|---|
| `bg-background` / `bg-card` / `bg-surface` | page canvas / white cards / inset panels, inputs |
| `text-ink` / `text-muted` | primary / secondary text |
| `border-line` / `divide-line` | every border and divider |
| `bg-accent text-accent-fg` | primary buttons |
| `bg-accent-weak text-accent` / `border-accent` | subtle accent chip / active-selected outline |
| `text-warn` `text-ok` `text-danger` (+ `bg-warn/10`, `border-ok/40`, …) | status: amber = pending/attention, green = paid/done, red = cancelled/error |
| `bg-sidebar` / `text-sidebar-fg` / `bg-sidebar-active text-sidebar-active-fg` | the desk nav rail |

Type: `font-sans` (IBM Plex Sans) is the default. `font-mono` (IBM Plex Mono) is
**only** for the tracked uppercase micro-labels — table headers, stat-tile
labels, button text. The canonical label recipe is
`font-mono text-[10px] font-semibold uppercase tracking-widest text-muted`.

Radius: `rounded-md` on buttons and controls, `rounded-lg`/`rounded-xl` on
cards, `rounded-2xl` on large marketing cards. **Never `rounded-full` on a
control** — pills were deliberately removed.

Inside `.mkt` only, these hand-written classes are available:
`mkt-btn` + `mkt-btn-primary` / `mkt-btn-light` / `mkt-btn-ghost` (smooth-hover
button), `mkt-input` (blue focus-ring field), `mkt-card` (hover-lift card),
`mkt-eyebrow` (Spline uppercase tracked label), `mkt-serif` (Geist display),
`mkt-reveal` + `is-in` (scroll-into-view), and section backgrounds `mkt-hero`,
`mkt-cta-band`, `mkt-haze` / `mkt-haze-soft`, `mkt-auth-aside` / `mkt-auth-bg`,
`mkt-nav`. `<em>` inside `.mkt` is non-italic amber emphasis.

## Where the truth is

- **`tokens/tokens.css`** — the raw `:root` / `.mkt` custom properties,
  commented, both palettes. The fastest colour + font reference; read this first.
- **`styles.css`** — the full compiled stylesheet: the Tailwind utility surface,
  both palette token blocks, every `mkt-*` class, and the font `@import`. Grep it
  to confirm a utility exists before relying on it.

## Build snippet

```html
<!-- desk surface: default (orange) palette, IBM Plex -->
<section class="rounded-xl border border-line bg-card p-4 shadow-[0_1px_2px_rgba(20,32,29,0.04)]">
  <p class="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">Outstanding</p>
  <p class="mt-2 text-2xl font-semibold tabular-nums text-danger">LKR 24,000</p>
</section>

<button class="inline-flex h-10 items-center rounded-md bg-accent px-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-fg">
  + New order
</button>

<!-- customer-facing: wrap in .mkt for the blue palette + Geist / Spline -->
<div class="mkt">
  <h2 class="mkt-serif text-3xl text-ink">Take the order. <em>Skip the chaos.</em></h2>
  <button class="mkt-btn mkt-btn-primary h-11 px-5 text-[12px] uppercase tracking-[0.16em]">Start free</button>
</div>
```
