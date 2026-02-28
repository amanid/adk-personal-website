"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartCardProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  color?: string;
}

export default function BarChartCard({ title, data, color }: BarChartCardProps) {
  const barColor = color || "var(--color-gold, #c9a84c)";

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-text-secondary text-sm py-8 text-center">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-glass-border, #333)" />
            <XAxis type="number" stroke="var(--color-text-muted, #888)" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--color-text-muted, #888)"
              fontSize={11}
              width={120}
              tickFormatter={(v) => (v.length > 20 ? v.slice(0, 20) + "…" : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-navy, #0f1629)",
                border: "1px solid var(--color-glass-border, #333)",
                borderRadius: "8px",
                color: "var(--color-text-primary, #fff)",
              }}
            />
            <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
