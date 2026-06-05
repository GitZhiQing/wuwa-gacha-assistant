import { create } from "zustand";
import type { GachaRecordRow, OverviewStats, PoolAnalysis } from "@/lib/types";
import { loadRecords } from "@/lib/db";

interface GachaState {
  // 原始数据
  allRecords: Map<number, GachaRecordRow[]>;
  isLoading: boolean;

  // 分析结果
  overview: OverviewStats | null;
  poolAnalyses: Map<number, PoolAnalysis>;

  // Actions
  loadFromDatabase: (userId: string) => Promise<void>;
  setOverview: (stats: OverviewStats) => void;
  setPoolAnalysis: (poolType: number, analysis: PoolAnalysis) => void;
  clearAll: () => void;
}

export const useGachaStore = create<GachaState>((set, get) => ({
  allRecords: new Map(),
  isLoading: false,

  overview: null,
  poolAnalyses: new Map(),

  loadFromDatabase: async (userId: string) => {
    set({ isLoading: true });
    try {
      const poolTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const allRecords = new Map<number, GachaRecordRow[]>();

      for (const pt of poolTypes) {
        const records = await loadRecords(userId, pt);
        if (records.length > 0) {
          allRecords.set(pt, records);
        }
      }

      set({ allRecords, isLoading: false });
    } catch (e) {
      console.error("Failed to load from database:", e);
      set({ isLoading: false });
    }
  },

  setOverview: (stats) => set({ overview: stats }),

  setPoolAnalysis: (poolType, analysis) => {
    const poolAnalyses = new Map(get().poolAnalyses);
    poolAnalyses.set(poolType, analysis);
    set({ poolAnalyses });
  },

  clearAll: () =>
    set({
      allRecords: new Map(),
      overview: null,
      poolAnalyses: new Map(),
    }),
}));
