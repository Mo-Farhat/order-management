/* Pure-CSS product mockups for the marketing page — styled with the .mkt
 * palette. Product photos: Unsplash (free, commercial use, no attribution
 * required). Swap for real customer shots any time. */

const UNSPLASH = "https://images.unsplash.com";
const img = (id: string) => `${UNSPLASH}/${id}?auto=format&fit=crop&w=360&h=360&q=70`;

const BOUTIQUE = [
  { name: "Merino crewneck", price: "8,900", src: img("photo-1556905055-8f358a7a47b2") },
  { name: "Capsule edit", price: "12,500", src: img("photo-1567113463300-102a7eb3cb26") },
  { name: "Folded knits", price: "15,000", src: img("photo-1630329273801-8f629dba0a72") },
  { name: "Leather goods", price: "4,200", src: img("photo-1614676471928-2ed0ad1061a4") },
];

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
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-card text-left shadow-[0_40px_120px_-40px_rgba(15,30,90,0.55)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface px-3 py-2">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="ml-3 text-[10px] text-muted">sfdesk.app/desk</span>
      </div>

      <div className="grid grid-cols-1 text-[11px] sm:grid-cols-[128px_1fr]">
        {/* sidebar */}
        <div className="hidden flex-col gap-1 border-r border-line bg-surface p-3 sm:flex">
          <span className="mkt-serif mb-1 text-sm text-ink">SFDesk</span>
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
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Dashboard</span>
            <span className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-accent-fg">
              + New order
            </span>
          </div>

          <div className="rounded-lg border border-[color:var(--amber)]/40 bg-[color:var(--amber-weak)] px-3 py-2 text-[color:var(--amber)]">
            <strong>3</strong> storefront orders awaiting review
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["To dispatch", "7"],
              ["Open orders", "12"],
              ["Outstanding", "LKR 24k"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-line p-2">
                <p className="mkt-eyebrow text-[8px] text-muted">{l}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line p-2">
              <p className="mkt-eyebrow text-[8px] text-muted">Orders this week</p>
              <div className="mt-2 flex h-16 items-end gap-1.5">
                {[40, 65, 50, 80, 55, 95, 70].map((h, i) => (
                  <Bar key={i} h={h} on={i === 5} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
              <p className="mkt-eyebrow text-[8px] text-muted">Recent</p>
              {[
                ["#1043", "Paid"],
                ["#1042", "Unpaid"],
                ["#1041", "Paid"],
              ].map(([n, s]) => (
                <div key={n} className="flex items-center justify-between">
                  <span className="font-medium text-accent">{n}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase ${
                      s === "Paid" ? "bg-accent/10 text-accent" : "bg-surface text-muted"
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
    <div className="mx-auto w-[248px] rounded-[2.4rem] border-[7px] border-ink bg-ink p-2 shadow-[0_40px_80px_-20px_rgba(15,30,90,0.45)]">
      <div className="overflow-hidden rounded-[1.9rem] bg-card">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            M
          </span>
          <div>
            <p className="mkt-serif text-sm text-ink">Marlowe</p>
            <p className="text-[9px] text-muted">Browse &amp; send your order to our DMs</p>
          </div>
        </div>

        <div className="flex gap-1.5 px-3 py-2">
          {["All", "Knitwear", "Denim"].map((c, i) => (
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

        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {BOUTIQUE.map((p, i) => (
            <div
              key={p.name}
              className={`overflow-hidden rounded-lg border ${
                i === 0 ? "border-accent" : "border-line"
              }`}
            >
              <div className="aspect-square bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="p-1.5">
                <p className="truncate text-[10px] font-medium text-ink">{p.name}</p>
                <p className="text-[9px] text-muted">LKR {p.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="m-3 mt-0 flex items-center justify-between rounded-full bg-accent px-3 py-2 text-[10px] font-semibold text-accent-fg">
          <span>2 items · LKR 21,400</span>
          <span>View order →</span>
        </div>
      </div>
    </div>
  );
}

/* Small feature-card visuals ------------------------------------------------ */

export function MiniPipeline() {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      {[
        ["Pending", "bg-[color:var(--amber-weak)] text-[color:var(--amber)]"],
        ["Confirmed", "bg-accent/10 text-accent"],
        ["Dispatched", "bg-accent/10 text-accent"],
        ["Paid", "bg-accent text-accent-fg"],
      ].map(([l, c], i) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 font-semibold ${c}`}>{l}</span>
          {i < 3 && <span className="text-line">→</span>}
        </span>
      ))}
    </div>
  );
}

export function MiniChannels() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted">
      <span className="rounded-md border border-line bg-card px-2 py-1 font-medium text-ink">
        wa.me/94…
      </span>
      <span className="text-line">+</span>
      <span className="rounded-md border border-line bg-card px-2 py-1 font-medium text-ink">
        ig.me/m/…
      </span>
    </div>
  );
}

export function MiniStock() {
  return (
    <div className="flex flex-col gap-1.5">
      {[
        ["Linen shirt", 24, false],
        ["Silk scarf", 3, true],
        ["Wool coat", 11, false],
      ].map(([name, n, low]) => (
        <div key={name as string} className="flex items-center justify-between text-[11px]">
          <span className="text-ink">{name}</span>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              low ? "bg-[color:var(--amber-weak)] text-[color:var(--amber)]" : "text-muted"
            }`}
          >
            {n} {low ? "· low" : "in stock"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MiniExport() {
  return (
    <div className="rounded-md border border-line bg-surface p-2 font-mono text-[10px] text-muted">
      <p>name,phone,orders,spent</p>
      <p className="text-ink">John Doe,•••• 4821,6,42800</p>
      <p className="text-ink">Jane Doe,•••• 7390,3,15900</p>
    </div>
  );
}
