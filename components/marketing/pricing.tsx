import { TIERS } from "@/lib/tiers";

export function Pricing() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid w-full max-w-5xl gap-5 sm:grid-cols-3">
        {TIERS.map((t) => {
          return (
            <div
              key={t.key}
              className="mkt-card flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-6"
            >
              <p className="mkt-eyebrow text-[11px] text-muted">{t.name}</p>
              <p className="mkt-serif mt-3 text-4xl text-muted">Coming soon</p>
              <p className="mt-1 text-xs text-muted">{t.tagline}</p>
              <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span>•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex h-11 items-center justify-center rounded-md border border-line px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                Not yet available
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
