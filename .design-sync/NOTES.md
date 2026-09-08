# design-sync notes — SFDesk

## What this sync is

This repo is a **Next.js app, not a component library** — no build that emits a
component package, no Storybook, no `dist/`. It is synced as a **tokens-only
design system**: `styles.css` (compiled Tailwind surface + both palettes + the
`.mkt-*` classes + font import), `tokens/tokens.css`, and a conventions README.
No components. `window.SFDeskUI` is an empty bundle by design.

Scope decision history: user first picked "extract a DS subset (~28 components)",
then on seeing the hand-build cost narrowed to **tokens + styles only**.

## Synthetic package

The converter's `package` shape needs a package dir to resolve `cfg.cssEntry`
against. `.design-sync/pkg/` is that dir — committed:
- `package.json` (name `sfdesk-ui`), `index.js` (`export {}` — empty bundle)
- `tokens.css` — hand-written raw token reference, both palettes
- `styles.css` — **generated**, gitignored (see below)
- `src/` — empty, so discovery finds 0 components → `[ZERO_MATCH]` → tokens-only

Build command (from repo root):
```
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry .design-sync/pkg/index.js --out ./ds-bundle
```

## How styles.css is built

1. `.design-sync/gen-safelist.mjs` → `.design-sync/_safelist.txt` — a broad,
   fixed vocabulary of Tailwind utility class names (spacing/flex/grid/type/
   color-for-every-token/radius/shadow/state+breakpoint variants).
2. `.design-sync/ds.src.css` = `@import "tailwindcss" source(none)` +
   `@source "./_safelist.txt"` + the `:root` / `@theme inline` / `body` /
   `.mkt,.sf-theme` / all `.mkt-*` blocks **mirrored verbatim from
   `app/globals.css`** (everything after its `@import "tailwindcss"`).
3. `./.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/ds.src.css -o .design-sync/pkg/styles.css`

`tokens/tokens.css` is **copied into `ds-bundle/` manually** after the converter
run — the converter only copies token files from a real `node_modules`
`tokensPkg`, which doesn't exist here:
```
cp .design-sync/pkg/tokens.css ds-bundle/tokens/tokens.css
```
(This means `_ds_sync.json` doesn't hash `tokens/tokens.css`; a re-sync just
re-uploads it, which is idempotent.)

## Known render warns

- `[FONT_REMOTE]` — expected. Fonts (IBM Plex Sans/Mono, Geist, Spline Sans)
  load from Google Fonts via an `@import` in `_ds_bundle.css`. The app itself
  self-hosts them with next/font; the DS bundle uses the CDN. "Cambria" also
  appears — it's from a Tailwind default `font-serif` stack, a system font, no
  action.
- `tokens: N defined, M referenced (1 missing, below threshold)` — one
  unresolved `var()` in the compiled Tailwind output, below the warn threshold.

## Re-sync steps

1. `cp -r <skill>/… .ds-sync/` (re-stage scripts), `(cd .ds-sync && npm i)` on a
   fresh clone; also `npm i esbuild ts-morph @types/react @tailwindcss/cli` there.
2. If `app/globals.css` changed: re-mirror its post-`@import` CSS into
   `.design-sync/ds.src.css` (the blocks between the markers).
3. `node .design-sync/gen-safelist.mjs`
4. `./.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/ds.src.css -o .design-sync/pkg/styles.css`
5. `node .ds-sync/package-build.mjs --config … --entry .design-sync/pkg/index.js --out ./ds-bundle`
6. `cp .design-sync/pkg/tokens.css ds-bundle/tokens/tokens.css`
7. `node .ds-sync/package-validate.mjs ./ds-bundle` — must exit 0
8. Upload per base SKILL.md §5 (atomic path on re-sync — project is non-empty).

## Re-sync risks

- **`.design-sync/ds.src.css` holds a hand-mirrored copy of `app/globals.css`'s
  non-Tailwind CSS.** It silently drifts if globals.css changes and step 2 is
  skipped. There is no automated check. On any re-sync, diff the `.mkt-*` /
  `:root` blocks in `ds.src.css` against `app/globals.css` first.
- **`_safelist.txt` is a fixed vocabulary.** New Tailwind utility patterns the
  app adopts (a new spacing step, a new arbitrary value used widely) won't be in
  the uploaded `styles.css` until `gen-safelist.mjs` is extended. If a design
  built on claude.ai/design looks unstyled in places, a missing utility is the
  likely cause — extend the safelist and re-sync.
- The generated README body (below the conventions header) is generic
  "load components / `window.SFDeskUI.*`" boilerplate that does not apply here.
  The conventions header's first paragraph explicitly tells the reader to ignore
  it. If the converter's README template changes, re-check that neutralization.
- Two palette scopes (`.mkt`, `.sf-theme`) redefine the same token names. A
  design that forgets the wrapper renders in the desk (orange) palette — that's
  the documented default, not a bug.
