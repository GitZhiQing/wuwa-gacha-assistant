"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PoolTabs, ANALYSIS_POOLS } from "@/components/analysis/PoolTabs";
import { PoolStats } from "@/components/analysis/PoolStats";
import { FiveStarTable } from "@/components/analysis/FiveStarTable";
import { PityChart } from "@/components/analysis/PityChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGachaStore } from "@/store/gacha-store";
import { useGachaInit } from "@/hooks/useGachaInit";
import { POOL_TYPE_MAP } from "@/lib/constants";

/** 无数据卡池的提示消息 */
const EMPTY_POOL_MESSAGES: Record<string, string> = {
  collaborate: "该卡池暂无抽卡记录（联动卡池将于 3.4 版本上线）",
  beginner: "该卡池暂无抽卡记录",
  default: "暂无数据，请先同步抽卡记录",
};

function getEmptyPoolMessage(poolType: number): string {
  if (poolType === 10 || poolType === 11) return EMPTY_POOL_MESSAGES.collaborate;
  if (poolType === 8 || poolType === 9) return EMPTY_POOL_MESSAGES.beginner;
  return EMPTY_POOL_MESSAGES.default;
}

export default function AnalysisPage() {
  const router = useRouter();
  const { allRecords, poolAnalyses, isLoading } = useGachaStore();
  const { hasData } = useGachaInit({ redirectIfNoParams: true });

  const [activeTab, setActiveTab] = useState(1);

  // 选择第一个有数据的 Tab
  useEffect(() => {
    if (allRecords.size > 0) {
      const firstAvailable = ANALYSIS_POOLS.find((pt) =>
        allRecords.has(pt)
      );
      if (firstAvailable) setActiveTab(firstAvailable);
    }
  }, [allRecords]);

  const availablePools = new Set(allRecords.keys());
  const currentAnalysis = poolAnalyses.get(activeTab);
  const info = POOL_TYPE_MAP[activeTab];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">暂无抽卡数据</h2>
          <p className="text-muted-foreground">
            请先导入你的抽卡记录
          </p>
          <Button onClick={() => router.push("/import")}>
            前往导入
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pt-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">卡池分析</h1>
        <p className="text-sm text-muted-foreground">
          查看各卡池的详细抽卡数据与分析
        </p>
      </div>

      {/* Tab 栏 */}
      <PoolTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availablePools={availablePools}
      />

      {/* 有数据的卡池 */}
      {currentAnalysis && info ? (
        <div className="space-y-6">
          <PoolStats analysis={currentAnalysis} />

          <PityChart entries={currentAnalysis.fiveStarEntries} />

          <div>
            <h3 className="mb-3 text-sm font-medium">
              五星记录 ({currentAnalysis.totalFiveStars})
            </h3>
            <FiveStarTable
              entries={currentAnalysis.fiveStarEntries}
              poolType={activeTab}
            />
          </div>
        </div>
      ) : (
        /* 无数据的卡池 */
        <div className="flex h-60 items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-muted-foreground">
              {getEmptyPoolMessage(activeTab)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
