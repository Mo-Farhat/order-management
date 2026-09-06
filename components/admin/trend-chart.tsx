"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/admin";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  // thin the x-axis labels so long ranges stay readable
  const step = Math.ceil(data.length / 10);
  const fmtDay = (d: string) => d.slice(5); // MM-DD

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            interval={step - 1}
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            stroke="var(--color-line)"
          />
          <YAxis
            yAxisId="orders"
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            stroke="var(--color-line)"
            width={28}
          />
          <YAxis
            yAxisId="gmv"
            orientation="right"
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            stroke="var(--color-line)"
            width={44}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted)" }}
          />
          <Bar
            yAxisId="orders"
            dataKey="orders"
            name="Orders"
            fill="var(--color-accent)"
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
          />
          <Line
            yAxisId="gmv"
            type="monotone"
            dataKey="gmv"
            name="GMV"
            stroke="var(--color-warn)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="shops"
            name="New shops"
            stroke="var(--color-ink)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
