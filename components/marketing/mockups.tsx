/* Pure-CSS product mockups for the marketing page — no screenshots to keep
 * stale, styled with the app's own tokens so they read as the real thing. */

function Bar({ h, on }: { h: number; on?: boolean }) {
  return (
    <div
      className={`w-3 rounded-t ${on ? "bg-accent" : "bg-line"}`}
      style={{ height: `${h}%` }}
    />
  );
}

export function DashboardMock() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-line bg-card text-left shadow-[0_20px_60px_-20px_rgba(20,32,29,0.25)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface px-3 py-2">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 text-[10px] text-muted">pola.lk/desk</span>
      </div>

      <div className="grid grid-cols-[128px_1fr] text-[11px]">
        {/* sidebar */}
        <div className="hidden flex-col gap-1 border-r border-line bg-surface p-3 sm:flex">
          <span className="mkt-serif mb-1 text-sm text-ink">Pola</span>
          {["Dashboard", "Orders", "Catalog", "Storefront", "Settings"].map((x, i) => (
            <span
              key={x}
              className={`rounded px-2 py-1 ${
                i === 0 ? "bg-accent-weak font-medium text-accent" : "text-muted"
              }`}
            >
              {x}
            </span>
          ))}
        </div>

        {/* body */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Dashboard</span>
            <span className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-accent-fg">
              + New order
            </span>
          </div>

          {/* pending banner */}
          <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-warn">
            <strong>3</strong> storefront orders awaiting review
          </div>

          {/* stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            {[
              ["To dispatch", "7"],
              ["Open orders", "12"],
              ["Outstanding", "LKR 24k"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-line p-2">
                <p className="font-mono text-[8px] uppercase tracking-widest text-muted">{l}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{v}</p>
              </div>
            ))}
          </div>

          {/* chart + list */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line p-2">
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted">
                Orders this week
              </p>
              <div className="mt-2 flex h-16 items-end gap-1.5">
                {[40, 65, 50, 80, 55, 95, 70].map((h, i) => (
                  <Bar key={i} h={h} on={i === 5} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted">Recent</p>
              {[
                ["#1043", "Paid"],
                ["#1042", "Unpaid"],
                ["#1041", "Paid"],
              ].map(([n, s]) => (
                <div key={n} className="flex items-center justify-between">
                  <span className="font-mono text-accent">{n}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase ${
                      s === "Paid" ? "bg-ok/10 text-ok" : "bg-surface text-muted"
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneStorefrontMock() {
  return (
    <div className="mx-auto w-[240px] rounded-[2rem] border-[6px] border-ink bg-ink p-2 shadow-[0_30px_60px_-15px_rgba(20,32,29,0.35)]">
      <div className="overflow-hidden rounded-[1.5rem] bg-card">
        {/* header */}
        <div className="flex items-center gap-2 border-b border-line p-3">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            A
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">Aisha&apos;s Kitchen</p>
            <p className="text-[9px] text-muted">Browse & send your order to our DMs</p>
          </div>
        </div>

        {/* chips */}
        <div className="flex gap-1.5 px-3 py-2">
          {["All", "Cakes", "Snacks"].map((c, i) => (
            <span
              key={c}
              className={`rounded-full border px-2 py-0.5 text-[9px] ${
                i === 0 ? "border-accent bg-accent text-accent-fg" : "border-line text-muted"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        {/* grid */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {[
            ["Butter cake", "1,200"],
            ["Choc gateau", "3,500"],
            ["Cheese rolls", "600"],
            ["Fish buns", "480"],
          ].map(([n, p], i) => (
            <div
              key={n}
              className={`rounded-lg border p-2 ${i === 1 ? "border-accent" : "border-line"}`}
            >
              <div className="mb-1.5 h-12 rounded bg-surface" />
              <p className="text-[10px] font-medium text-ink">{n}</p>
              <p className="text-[9px] text-muted">LKR {p}</p>
            </div>
          ))}
        </div>

        {/* cart bar */}
        <div className="m-3 mt-0 flex items-center justify-between rounded-full bg-accent px-3 py-2 text-[10px] font-semibold text-accent-fg">
          <span>2 items · LKR 4,700</span>
          <span>View order →</span>
        </div>
      </div>
    </div>
  );
}
