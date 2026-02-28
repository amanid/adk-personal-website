"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartCardProps {
  title: string;
  data: Array<{ date: string; views: number }>;
}

export default function AreaChartCard({ title, data }: AreaChartCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-text-secondary text-sm py-8 text-center">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-gold, #c9a84c)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-gold, #c9a84c)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-glass-border, #333)" />
            <XAxis
              dataKey="date"
              stroke="var(--color-text-muted, #888)"
              fontSize={12}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis stroke="var(--color-text-muted, #888)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-navy, #0f1629)",
                border: "1px solid var(--color-glass-border, #333)",
                borderRadius: "8px",
                color: "var(--color-text-primary, #fff)",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-gold, #c9a84c)"
              fillOpacity={1}
              fill="url(#colorViews)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
