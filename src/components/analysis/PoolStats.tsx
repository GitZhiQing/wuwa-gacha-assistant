import { Card } from "@/components/ui/card";
import type { PoolAnalysis } from "@/lib/types";
import { POOL_TYPE_MAP } from "@/lib/constants";

interface PoolStatsProps {
  analysis: PoolAnalysis;
}

export function PoolStats({ analysis }: PoolStatsProps) {
  const info = POOL_TYPE_MAP[analysis.poolType];
  const hasWarp = info?.hasWarp ?? false;
  const warpRate =
    analysis.totalFiveStars > 0
      ? Math.round((analysis.lostCount / analysis.totalFiveStars) * 1000) / 10
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatItem label="总抽数" value={analysis.totalPulls} />
      <StatItem label="五星数" value={analysis.totalFiveStars} />
      {hasWarp && (
        <>
          <StatItem
            label="歪卡率"
            value={`${warpRate}%`}
            sub={`${analysis.lostCount}/${analysis.totalFiveStars}`}
          />
        </>
      )}
      <StatItem
        label="平均出货抽数"
        value={analysis.avgPity}
      />
      {hasWarp && (
        <StatItem
          label="当前保底状态"
          value={
            analysis.currentGuarantee ? "大保底" : "小保底"
          }
          sub={`已垫 ${analysis.currentPity} 抽`}
        />
      )}
      {!hasWarp && (
        <StatItem
          label="距保底"
          value={`${80 - analysis.currentPity} 抽`}
          sub={`已垫 ${analysis.currentPity} 抽`}
        />
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
