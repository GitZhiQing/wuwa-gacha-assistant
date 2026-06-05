import { create } from "zustand";
import type { UserParams } from "@/lib/types";

interface UserState {
  params: UserParams | null;
  hasParams: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  setParams: (params: UserParams) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (time: string) => void;
  clearParams: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  params: null,
  hasParams: false,
  isSyncing: false,
  lastSyncAt: null,

  setParams: (params) => set({ params, hasParams: true }),

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setLastSyncAt: (time) => set({ lastSyncAt: time }),

  clearParams: () =>
    set({ params: null, hasParams: false, lastSyncAt: null }),
}));
