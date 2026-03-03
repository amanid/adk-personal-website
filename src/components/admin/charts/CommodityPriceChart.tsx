"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CommodityPriceChartProps {
  title: string;
  symbol: string;
  data: Array<{ date: string; close: number }>;
  color?: string;
}

export default function CommodityPriceChart({
  title,
  data,
  color,
}: CommodityPriceChartProps) {
  const id = useId();
  const gradientId = `price-${id.replace(/:/g, "")}`;
  const strokeColor = color || "var(--color-gold, #c9a84c)";

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-medium mb-3 text-text-secondary">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-text-muted text-sm">
          No chart data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-glass-border, #333)"
            />
            <XAxis
              dataKey="date"
              stroke="var(--color-text-muted, #888)"
              fontSize={11}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              stroke="var(--color-text-muted, #888)"
              fontSize={11}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-navy, #0f1629)",
                border: "1px solid var(--color-glass-border, #333)",
                borderRadius: "8px",
                color: "var(--color-text-primary, #fff)",
              }}
              labelFormatter={(label) => {
                const d = new Date(label);
                return d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
              formatter={(value: number | undefined) => {
                if (value == null) return ["N/A", "Close"];
                return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Close"];
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
