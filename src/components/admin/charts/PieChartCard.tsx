"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#c9a84c", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899"];

interface PieChartCardProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export default function PieChartCard({ title, data }: PieChartCardProps) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-text-secondary text-sm py-8 text-center">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-navy, #0f1629)",
                border: "1px solid var(--color-glass-border, #333)",
                borderRadius: "8px",
                color: "var(--color-text-primary, #fff)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "var(--color-text-secondary, #aaa)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
