"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGachaStore } from "@/store/gacha-store";
import { useUserStore } from "@/store/user-store";
import { loadParams, getLastSyncAt } from "@/lib/params";
import { loadRecords } from "@/lib/db";
import { runFullAnalysis } from "@/lib/gacha-analysis";
import { ALL_POOL_TYPES } from "@/lib/constants";
import type { GachaRecordRow } from "@/lib/types";

interface UseGachaInitOptions {
  /** 无参数时是否重定向到导入页，默认 true */
  redirectIfNoParams?: boolean;
  /** 已有数据时是否跳过加载，默认 true */
  skipIfDataReady?: boolean;
}

/**
 * 统一的抽卡数据初始化 Hook
 *
 * 封装了参数加载 → 数据库读取 → 分析 → 写入 Store 的完整流程。
 * 概览页和分析页共用此 Hook，消除重复的初始化逻辑。
 */
export function useGachaInit(options: UseGachaInitOptions = {}) {
  const { redirectIfNoParams = true, skipIfDataReady = true } = options;

  const router = useRouter();
  const { overview, loadedUserId, isLoading, setAnalysisResult, setLoading, clearAll } =
    useGachaStore();
  const { setParams, setLastSyncAt } = useUserStore();

  useEffect(() => {
    async function init() {
      // 1. 加载用户参数
      const params = await loadParams();

      // 无参数 → 跳转或停止
      if (!params) {
        if (redirectIfNoParams) {
          router.push("/import");
        }
        setLoading(false);
        return;
      }

      // 2. 检测用户是否切换：如果缓存的 userId 与参数不一致，清空并让 effect 重跑
      if (loadedUserId && loadedUserId !== params.playerId) {
        clearAll();
        return; // 状态变更会触发 effect 重跑，届时 loadedUserId 为 null，将进入加载分支
      }

      // 3. 已有当前用户的数据时跳过，避免重复加载
      if (skipIfDataReady && overview) return;

      // 4. 同步参数到 userStore
      setParams(params);

      // 5. 加载上次同步时间
      const lastSync = await getLastSyncAt();
      if (lastSync) setLastSyncAt(lastSync);

      // 6. 从数据库加载所有卡池数据
      const allRecs = new Map<number, GachaRecordRow[]>();
      for (const pt of ALL_POOL_TYPES) {
        const records = await loadRecords(params.playerId, pt);
        if (records.length > 0) allRecs.set(pt, records);
      }

      // 7. 运行分析并写入 Store
      if (allRecs.size > 0) {
        const { overview, poolAnalyses } = runFullAnalysis(allRecs);
        setAnalysisResult(params.playerId, allRecs, overview, poolAnalyses);
      } else {
        setAnalysisResult(params.playerId, new Map(), null, new Map());
      }
    }

    init();
  }, [
    router,
    overview,
    loadedUserId,
    skipIfDataReady,
    redirectIfNoParams,
    setParams,
    setLastSyncAt,
    setAnalysisResult,
    setLoading,
    clearAll,
  ]);

  return {
    isLoading,
    hasData: overview !== null && overview.totalPulls > 0,
    isReady: !isLoading,
  };
}
