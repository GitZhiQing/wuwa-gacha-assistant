"use client";

import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Users, Sword, Sparkles, Crosshair } from "lucide-react";
import { OwnedList } from "@/components/overview/OwnedList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGachaStore } from "@/store/gacha-store";
import { useUserStore } from "@/store/user-store";
import { useGachaInit } from "@/hooks/useGachaInit";
import { LIMITED_POOL_TYPES, POOL_TYPE_MAP } from "@/lib/constants";
import type { PoolAnalysis } from "@/lib/types";

/** 概览页展示的卡池（按展示顺序） */
const OVERVIEW_POOLS = LIMITED_POOL_TYPES; // [1, 2, 9, 10]

/** 卡池图标映射 */
const POOL_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Users,
  2: Sword,
  10: Crosshair,
  11: Sparkles,
};

function PoolSection({ analysis, poolType }: { analysis: PoolAnalysis; poolType: number }) {
  const info = POOL_TYPE_MAP[poolType];
  const hasWarp = info?.hasWarp ?? false;
  const Icon = POOL_ICONS[poolType];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span>{info?.name ?? `卡池 ${poolType}`}</span>
          <span className="ml-auto flex items-baseline gap-0.5">
            <span className="text-base font-bold tabular-nums">{analysis.totalPulls}</span>
            <span className="text-xs text-muted-foreground">抽</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {hasWarp && (
            <span>
              <span className="text-destructive">歪</span>
              <span className="text-foreground">/</span>
              出：
              <span className="font-semibold text-destructive tabular-nums">
                {analysis.lostCount}
              </span>
              <span className="text-foreground">/</span>
              <span className="font-semibold text-foreground tabular-nums">
                {analysis.totalFiveStars}
              </span>
            </span>
          )}
          <span>
            平均(限定)：
            <span className="font-semibold text-foreground tabular-nums">
              {analysis.avgPity}
            </span>{" "}
            抽
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { overview, poolAnalyses, isLoading } = useGachaStore();
  const { lastSyncAt } = useUserStore();

  useGachaInit({ redirectIfNoParams: true });

  // 无数据状态
  if (!isLoading && (!overview || overview.totalPulls === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">暂无抽卡数据</h2>
          <p className="text-muted-foreground">请先导入你的抽卡记录</p>
          <Button onClick={() => router.push("/import")}>前往导入</Button>
        </div>
      </div>
    );
  }

  // Loading 状态
  if (isLoading || !overview) {
    return (
      <div className="space-y-6 p-6 pt-12">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pt-12">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">概览</h1>
          {lastSyncAt && (
            <p className="text-sm text-muted-foreground">
              上次同步：{new Date(lastSyncAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
        <Button onClick={() => router.push("/import")}>同步最新数据</Button>
      </div>

      {/* 全局统计 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总抽卡数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{overview.totalPulls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              平均出金
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {overview.avgPity > 0 ? overview.avgPity : "-"}
            </p>
            {overview.avgPity > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                全部卡池共 {overview.totalFiveStars} 金
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 各卡池统计 — 两两一行 */}
      {([0, 2] as const).map((start) => {
        const pair = OVERVIEW_POOLS.slice(start, start + 2);
        return (
          <div key={start} className="grid grid-cols-2 gap-4">
            {pair.map((poolType) => {
              const analysis = poolAnalyses.get(poolType);
              if (!analysis || analysis.totalPulls === 0) return null;
              return <PoolSection key={poolType} analysis={analysis} poolType={poolType} />;
            })}
          </div>
        );
      })}

      {/* 拥有的角色和武器 */}
      <div className="grid grid-cols-2 gap-4">
        <OwnedList title="限定五星角色" items={overview.ownedLimitedChars} variant="gold" />
        <OwnedList title="限定五星武器" items={overview.ownedLimitedWeapons} variant="gold" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <OwnedList title="常驻五星角色" items={overview.ownedStandardChars} variant="secondary" />
        <OwnedList title="常驻五星武器" items={overview.ownedStandardWeapons} variant="secondary" />
      </div>
    </div>
  );
}
