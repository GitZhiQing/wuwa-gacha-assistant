import { create } from "zustand";
import type { GachaRecordRow, OverviewStats, PoolAnalysis } from "@/lib/types";

interface GachaState {
  // 当前加载数据所属的用户 ID
  loadedUserId: string | null;

  // 原始数据
  allRecords: Map<number, GachaRecordRow[]>;
  isLoading: boolean;

  // 分析结果
  overview: OverviewStats | null;
  poolAnalyses: Map<number, PoolAnalysis>;

  // Actions
  setAnalysisResult: (
    userId: string,
    allRecords: Map<number, GachaRecordRow[]>,
    overview: OverviewStats | null,
    poolAnalyses: Map<number, PoolAnalysis>
  ) => void;
  setLoading: (loading: boolean) => void;
  clearAll: () => void;
}

export const useGachaStore = create<GachaState>((set) => ({
  loadedUserId: null,
  allRecords: new Map(),
  isLoading: true,

  overview: null,
  poolAnalyses: new Map(),

  setAnalysisResult: (userId, allRecords, overview, poolAnalyses) =>
    set({ loadedUserId: userId, allRecords, overview, poolAnalyses, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAll: () =>
    set({
      loadedUserId: null,
      allRecords: new Map(),
      overview: null,
      poolAnalyses: new Map(),
      isLoading: false,
    }),
}));
