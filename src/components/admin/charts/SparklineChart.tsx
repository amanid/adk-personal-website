"use client";

import { useId } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: Array<{ date: string; value: number }>;
  color?: string;
  height?: number;
  positive?: boolean;
}

export default function SparklineChart({
  data,
  color,
  height = 40,
  positive = true,
}: SparklineChartProps) {
  const id = useId();
  const gradientId = `spark-${id.replace(/:/g, "")}`;
  const strokeColor = color || (positive ? "#34d399" : "#f87171");

  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
