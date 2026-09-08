/* Generates .design-sync/_safelist.txt — a broad Tailwind v4 utility surface so
 * the compiled styles.css carries what a design agent will actually reach for
 * (not just the classes our own component files happen to use). */
import { writeFileSync } from "node:fs";

const out = new Set();
const add = (...xs) => xs.forEach((x) => x && out.add(x));

const SP = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "10", "12", "14", "16", "20", "24"];
const FRAC = ["1/2", "1/3", "2/3", "1/4", "3/4", "1/5", "full", "auto", "fit", "min", "max"];
const SIZES = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"];
const RAD = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"];
const TOKENS = [
  "background", "foreground", "paper", "card", "surface", "ink", "muted", "line",
  "accent", "accent-fg", "accent-weak", "warn", "ok", "danger", "lime",
  "amber", "amber-weak",
  "sidebar", "sidebar-fg", "sidebar-muted", "sidebar-active", "sidebar-active-fg",
];
const OPA = ["5", "10", "15", "20", "25", "30", "40", "50", "60", "70", "80", "90"];
const STATES = ["hover", "focus", "focus-visible", "active", "disabled", "group-hover", "first", "last", "odd", "even"];
const BP = ["sm", "md", "lg", "xl", "2xl"];

// display / layout
add("block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid", "hidden", "contents", "table", "flow-root");
add("flex-row", "flex-col", "flex-row-reverse", "flex-col-reverse", "flex-wrap", "flex-nowrap", "flex-1", "flex-auto", "flex-initial", "flex-none", "grow", "grow-0", "shrink", "shrink-0", "basis-0", "basis-full");
for (const n of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]) add(`grid-cols-${n}`, `col-span-${n}`, `row-span-${n}`, `gap-${n}`);
add("grid-cols-none", "auto-cols-fr", "auto-rows-min");
for (const a of ["start", "end", "center", "baseline", "stretch"]) add(`items-${a}`, `self-${a}`);
for (const a of ["start", "end", "center", "between", "around", "evenly", "stretch"]) add(`justify-${a}`, `content-${a}`, `justify-items-${a}`, `place-items-${a}`, `place-content-${a}`);
add("mx-auto", "my-auto", "ml-auto", "mr-auto");

// spacing
for (const s of SP) {
  for (const p of ["p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe"]) add(`${p}-${s}`);
  for (const m of ["m", "mx", "my", "mt", "mr", "mb", "ml"]) { add(`${m}-${s}`); if (s !== "0" && s !== "px") add(`-${m}-${s}`); }
  add(`gap-${s}`, `gap-x-${s}`, `gap-y-${s}`, `space-x-${s}`, `space-y-${s}`);
}

// sizing
for (const s of [...SP, ...FRAC]) { add(`w-${s}`, `h-${s}`, `size-${s}`); }
for (const s of ["0", "full", "screen", "min", "max", "fit"]) add(`min-w-${s}`, `min-h-${s}`, `max-h-${s}`);
for (const s of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "full", "prose", "none", "screen-sm", "screen-md", "screen-lg"]) add(`max-w-${s}`);
add("aspect-square", "aspect-video", "aspect-auto");

// typography
for (const s of SIZES) add(`text-${s}`);
for (const w of ["thin", "light", "normal", "medium", "semibold", "bold", "extrabold"]) add(`font-${w}`);
add("font-sans", "font-mono", "font-serif");
for (const l of ["none", "tight", "snug", "normal", "relaxed", "loose", "3", "4", "5", "6", "7", "8", "9", "10"]) add(`leading-${l}`);
for (const t of ["tighter", "tight", "normal", "wide", "wider", "widest"]) add(`tracking-${t}`);
add("uppercase", "lowercase", "capitalize", "normal-case", "italic", "not-italic", "underline", "no-underline", "line-through", "truncate", "text-ellipsis", "text-nowrap", "whitespace-nowrap", "whitespace-pre-line", "break-words", "tabular-nums", "text-left", "text-center", "text-right", "text-balance", "text-pretty", "align-middle", "align-top", "align-baseline", "antialiased");
for (const n of ["1", "2", "3", "4", "5", "6", "none"]) add(`line-clamp-${n}`);

// color — every token, every channel, with common opacity steps
for (const t of TOKENS) {
  for (const c of ["bg", "text", "border", "divide", "ring", "fill", "stroke", "outline", "decoration", "shadow", "accent", "caret"]) add(`${c}-${t}`);
  for (const o of OPA) { add(`bg-${t}/${o}`, `text-${t}/${o}`, `border-${t}/${o}`, `ring-${t}/${o}`); }
}
for (const c of ["bg", "text", "border"]) { add(`${c}-white`, `${c}-black`, `${c}-transparent`, `${c}-current`, `${c}-inherit`); for (const o of OPA) { add(`${c}-black/${o}`, `${c}-white/${o}`); } }

// borders / radius / rings
add("border", "border-0", "border-2", "border-4", "border-8", "border-t", "border-r", "border-b", "border-l", "border-x", "border-y", "border-solid", "border-dashed", "border-dotted", "border-none", "divide-x", "divide-y");
for (const r of RAD) { add(`rounded-${r}`); for (const s of ["t", "b", "l", "r", "tl", "tr", "bl", "br"]) add(`rounded-${s}-${r}`); }
add("rounded");
add("ring", "ring-0", "ring-1", "ring-2", "ring-4", "ring-inset", "ring-offset-1", "ring-offset-2", "outline", "outline-none", "outline-1", "outline-2", "outline-offset-2");

// effects / filters
for (const s of ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "inner", "none"]) add(`shadow-${s}`);
add("shadow");
for (const o of ["0", "5", "10", "20", "25", "40", "50", "60", "70", "75", "80", "90", "95", "100"]) add(`opacity-${o}`);
add("blur", "blur-sm", "blur-md", "blur-lg", "backdrop-blur", "backdrop-blur-sm", "backdrop-blur-md", "brightness-95", "brightness-105", "brightness-110", "mix-blend-multiply");

// position / z / overflow
add("static", "relative", "absolute", "fixed", "sticky");
for (const s of ["0", "auto", "full", "1/2", "px"]) add(`inset-${s}`, `inset-x-${s}`, `inset-y-${s}`, `top-${s}`, `right-${s}`, `bottom-${s}`, `left-${s}`);
add("-top-1", "-right-1", "-bottom-1", "-left-1", "top-full", "bottom-full");
for (const z of ["0", "10", "20", "30", "40", "50", "auto"]) add(`z-${z}`);
add("overflow-hidden", "overflow-auto", "overflow-visible", "overflow-x-auto", "overflow-y-auto", "overflow-x-hidden", "overflow-y-hidden", "overflow-clip");

// object / bg
add("object-cover", "object-contain", "object-center", "object-top", "bg-cover", "bg-contain", "bg-center", "bg-no-repeat", "bg-gradient-to-r", "bg-gradient-to-b", "bg-gradient-to-br", "bg-clip-text");

// interactivity / misc
add("cursor-pointer", "cursor-default", "cursor-not-allowed", "cursor-text", "select-none", "select-text", "pointer-events-none", "pointer-events-auto", "appearance-none", "resize-none", "resize-y", "list-none", "list-disc", "sr-only", "will-change-transform");

// transitions / transforms / animation
add("transition", "transition-all", "transition-colors", "transition-opacity", "transition-transform", "transition-shadow", "duration-100", "duration-150", "duration-200", "duration-300", "duration-500", "duration-700", "ease-linear", "ease-in", "ease-out", "ease-in-out", "delay-100", "delay-200");
add("scale-95", "scale-100", "scale-105", "scale-110", "rotate-45", "-rotate-45", "rotate-90", "translate-y-0", "-translate-y-0.5", "-translate-y-1", "translate-x-0", "transform", "transform-gpu", "origin-top", "origin-center");
add("animate-spin", "animate-pulse", "animate-none");

// grid template niceties used in the app
add("grid-rows-[0fr]", "grid-rows-[1fr]");

// state + breakpoint variants for the practical subset
const variantBase = [
  "flex", "grid", "hidden", "block", "flex-row", "flex-col", "items-center", "justify-between", "justify-center",
  "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "font-semibold", "font-bold",
  "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "gap-2", "gap-3", "gap-4", "gap-6",
  "p-3", "p-4", "p-6", "px-4", "py-2", "mt-2", "mt-4", "w-full", "max-w-lg", "max-w-2xl",
  "rounded-md", "rounded-lg", "rounded-xl", "border", "border-line", "shadow-sm", "shadow-md",
  "bg-accent", "bg-card", "bg-surface", "bg-accent-weak", "text-ink", "text-muted", "text-accent",
  "text-accent-fg", "border-accent", "opacity-60", "opacity-100", "underline", "translate-y-0", "-translate-y-0.5",
  "brightness-105", "scale-105",
];
for (const v of [...STATES, ...BP]) for (const b of variantBase) add(`${v}:${b}`);

writeFileSync(new URL("./_safelist.txt", import.meta.url), [...out].sort().join("\n") + "\n");
console.log("wrote", out.size, "utility class names");
