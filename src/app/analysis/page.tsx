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
import { useUserStore } from "@/store/user-store";
import { loadParams, getLastSyncAt } from "@/lib/params";
import { loadRecords } from "@/lib/db";
import { runFullAnalysis } from "@/lib/gacha-analysis";
import { POOL_TYPE_MAP } from "@/lib/constants";
import type { GachaRecordRow } from "@/lib/types";

export default function AnalysisPage() {
  const router = useRouter();
  const {
    allRecords,
    poolAnalyses,
    overview,
    isLoading,
  } = useGachaStore();
  const { setParams, setLastSyncAt, hasParams } = useUserStore();

  const [activeTab, setActiveTab] = useState(1);

  // 初始化
  useEffect(() => {
    async function init() {
      if (overview) return; // 已有数据，跳过

      const params = await loadParams();
      if (params) {
        setParams(params);
      } else {
        router.push("/import");
        return;
      }

      const lastSync = await getLastSyncAt();
      if (lastSync) setLastSyncAt(lastSync);

      const allRecs = new Map<number, GachaRecordRow[]>();
      for (const pt of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const records = await loadRecords(params.playerId, pt);
        if (records.length > 0) allRecs.set(pt, records);
      }

      if (allRecs.size > 0) {
        const { overview, poolAnalyses } = runFullAnalysis(allRecs);
        useGachaStore.setState({
          allRecords: allRecs,
          overview,
          poolAnalyses,
          isLoading: false,
        });
      } else {
        useGachaStore.setState({ isLoading: false });
      }
    }

    init();
  }, [router, overview, setParams, setLastSyncAt]);

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

  if (!hasParams || allRecords.size === 0) {
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
              {activeTab === 9 || activeTab === 10
                ? "该卡池暂无抽卡记录（联动卡池将于 3.4 版本上线）"
                : activeTab === 7 || activeTab === 8
                  ? "该卡池暂无抽卡记录"
                  : "暂无数据，请先同步抽卡记录"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
