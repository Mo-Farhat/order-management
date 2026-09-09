import { platformOverview, shopsTable, platformTrend } from "@/lib/admin";
import { PageHeader, Card, StatCard } from "@/components/desk/ui";
import { RangeTabs } from "@/components/admin/range-tabs";
import { TrendChart } from "@/components/admin/trend-chart";
import { ShopsTable } from "@/components/admin/shops-table";

const RANGES: Record<string, number> = { "7": 7, "30": 30, "90": 90, all: 0 };

const nfmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : n.toFixed(0);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const rangeKey = sp.range && sp.range in RANGES ? sp.range : "30";
  const rangeDays = RANGES[rangeKey];
  const rangeLabel = rangeKey === "all" ? "all time" : `last ${rangeDays} days`;

  const [overview, shops, trend] = await Promise.all([
    platformOverview(),
    shopsTable(rangeDays),
    platformTrend(rangeDays),
  ]);

  const cur = overview.currencies.length === 1 ? overview.currencies[0] : "";
  const mixed = overview.currencies.length > 1;

  const plan = (k: string) => overview.planBreakdown[k] ?? 0;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`${overview.shopCount} shops · ${overview.activeShops30} active in the last 30 days`}
        actions={<RangeTabs />}
      />

      {/* headline numbers — all-time, not range-scoped */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Shops"
          value={overview.shopCount}
          hint={`+${overview.newShops7} this week · +${overview.newShops30} this month`}
        />
        <StatCard
          label="Platform GMV"
          value={`${cur} ${nfmt(overview.gmv)}`}
          hint={`${cur} ${nfmt(overview.collected)} collected${mixed ? " · mixed currencies" : ""}`}
          tone="accent"
        />
        <StatCard
          label="Outstanding"
          value={`${cur} ${nfmt(overview.outstanding)}`}
          hint="Unpaid + partial balances"
          tone={overview.outstanding > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Orders"
          value={overview.orderCount}
          hint={`${overview.customerCount} customers · ${overview.productCount} products`}
        />
      </div>

      {/* plan breakdown */}
      <Card title="Subscription status">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["trialing", "Trialing"],
            ["active", "Active"],
            ["past_due", "Past due"],
            ["read_only", "Read only"],
            ["cancelled", "Cancelled"],
          ].map(([k, label]) => (
            <div key={k} className="rounded-lg border border-line bg-surface px-3 py-3 text-center">
              <p className="text-lg font-semibold tabular-nums">{plan(k)}</p>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ["basic", "Basic"],
            ["studio", "Studio"],
            ["pro", "Pro"],
          ].map(([k, lbl]) => (
            <div key={k} className="rounded-lg border border-line bg-surface px-3 py-3 text-center">
              <p className="text-lg font-semibold tabular-nums">{overview.tierBreakdown[k] ?? 0}</p>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted">
                {lbl} tier
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          No payment provider is wired yet — set a shop&apos;s status by hand in the
          table below once they&apos;ve paid. Note that status is <strong>recorded, not
          enforced</strong>: nothing in the app gates access on it, so a shop marked
          read-only or cancelled still has full access until trial enforcement lands.
        </p>
      </Card>

      <Card title={`Activity — ${rangeLabel}`}>
        <TrendChart data={trend} />
        <p className="mt-1 text-xs text-muted">
          Bars: orders/day · line: GMV/day · dashed: new shops/day
        </p>
      </Card>

      <Card title={`Shops — ${rangeLabel}`} bodyClassName="p-0">
        <ShopsTable rows={shops} />
      </Card>
    </>
  );
}
