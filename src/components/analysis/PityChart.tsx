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
import type { FiveStarEntry } from "@/lib/types";

interface PityChartProps {
  entries: FiveStarEntry[];
}

export function PityChart({ entries }: PityChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">暂无数据可供图表展示</p>
      </div>
    );
  }

  // 将 pity 分到 10 抽一组的区间
  const buckets: Record<string, number> = {};
  for (let i = 0; i < 80; i += 10) {
    const label = `${i + 1}-${Math.min(i + 10, 80)}`;
    buckets[label] = 0;
  }

  for (const entry of entries) {
    const bucketIdx = Math.min(
      Math.floor((entry.pityCount - 1) / 10),
      7
    );
    const label = `${bucketIdx * 10 + 1}-${Math.min(bucketIdx * 10 + 10, 80)}`;
    buckets[label] = (buckets[label] || 0) + 1;
  }

  const data = Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-medium">保底分布</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            wrapperStyle={{ outline: "none" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "calc(var(--radius) - 2px)",
              fontSize: "13px",
              color: "hsl(var(--card-foreground))",
              boxShadow: "0 4px 12px hsl(0 0% 0% / 0.15)",
            }}
            labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
            itemStyle={{ color: "hsl(var(--gold))" }}
            formatter={(value: number) => [`${value} 次`, "出货"]}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--gold))"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
