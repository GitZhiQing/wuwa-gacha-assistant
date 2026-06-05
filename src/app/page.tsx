"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/overview/StatCard";
import { OwnedList } from "@/components/overview/OwnedList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGachaStore } from "@/store/gacha-store";
import { useUserStore } from "@/store/user-store";
import { loadParams, getLastSyncAt } from "@/lib/params";
import { loadRecords } from "@/lib/db";
import { runFullAnalysis } from "@/lib/gacha-analysis";
import type { GachaRecordRow } from "@/lib/types";

export default function OverviewPage() {
  const router = useRouter();
  const {
    allRecords,
    overview,
    isLoading,
    loadFromDatabase,
    setOverview,
    poolAnalyses,
  } = useGachaStore();
  const { hasParams, setParams, lastSyncAt, setLastSyncAt } = useUserStore();

  // 初始化：加载参数 + 数据 + 分析
  useEffect(() => {
    async function init() {
      // 加载用户参数
      const params = await loadParams();
      if (params) {
        setParams(params);
      } else {
        // 没有参数，跳转到导入页
        router.push("/import");
        return;
      }

      // 加载上次同步时间
      const lastSync = await getLastSyncAt();
      if (lastSync) setLastSyncAt(lastSync);

      // 从数据库加载数据
      const poolTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const allRecs = new Map<number, GachaRecordRow[]>();
      for (const pt of poolTypes) {
        const records = await loadRecords(params.playerId, pt);
        if (records.length > 0) allRecs.set(pt, records);
      }

      // 运行分析
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
  }, [router, setParams, setLastSyncAt]);

  // 无数据状态
  if (!isLoading && (!overview || overview.totalPulls === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
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

  // Loading 状态
  if (isLoading || !overview) {
    return (
      <div className="space-y-6 p-6 pt-12">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
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
        <Button onClick={() => router.push("/import")}>
          同步最新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="总抽数" value={overview.totalPulls} />
        <StatCard
          title="限定抽数"
          value={overview.totalLimitedPulls}
        />
        <StatCard
          title="五星角色平均抽数"
          value={overview.avgPullsPerFiveStar}
          subtitle="限定角色池"
        />
        <StatCard
          title="限定角色平均抽数"
          value={overview.avgPullsPerLimitedChar}
          subtitle="仅限 UP 角色"
        />
        <StatCard
          title="限定武器平均抽数"
          value={overview.avgPullsPerLimitedWeapon}
        />
      </div>

      {/* 拥有的角色和武器 */}
      <div className="grid grid-cols-2 gap-4">
        <OwnedList
          title="拥有的限定五星角色"
          items={overview.ownedLimitedChars}
          variant="gold"
        />
        <OwnedList
          title="拥有的限定五星武器"
          items={overview.ownedLimitedWeapons}
          variant="gold"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <OwnedList
          title="拥有的常驻五星角色"
          items={overview.ownedStandardChars}
          variant="secondary"
        />
        <OwnedList
          title="拥有的常驻五星武器"
          items={overview.ownedStandardWeapons}
          variant="secondary"
        />
      </div>
    </div>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M7 16h2" />
      <path d="M11 11h2" />
      <path d="M15 13h2" />
      <path d="M19 7h2" />
    </svg>
  );
}
