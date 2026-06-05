import { create } from "zustand";
import type { GachaRecordRow, OverviewStats, PoolAnalysis } from "@/lib/types";

interface GachaState {
  // 原始数据
  allRecords: Map<number, GachaRecordRow[]>;
  isLoading: boolean;

  // 分析结果
  overview: OverviewStats | null;
  poolAnalyses: Map<number, PoolAnalysis>;

  // Actions
  setAnalysisResult: (
    allRecords: Map<number, GachaRecordRow[]>,
    overview: OverviewStats,
    poolAnalyses: Map<number, PoolAnalysis>
  ) => void;
  setLoading: (loading: boolean) => void;
  clearAll: () => void;
}

export const useGachaStore = create<GachaState>((set) => ({
  allRecords: new Map(),
  isLoading: true,

  overview: null,
  poolAnalyses: new Map(),

  setAnalysisResult: (allRecords, overview, poolAnalyses) =>
    set({ allRecords, overview, poolAnalyses, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  clearAll: () =>
    set({
      allRecords: new Map(),
      overview: null,
      poolAnalyses: new Map(),
      isLoading: false,
    }),
}));
