import type { UserParams } from "./types";
import { isTauri } from "./tauri";

const PARAMS_KEY = "user_params";
const LAST_SYNC_KEY = "last_sync_at";

// ============================================================
// Tauri 环境：使用 Store 插件（持久化到 app_data_dir）
// ============================================================

async function getTauriStore() {
  const { Store } = await import("@tauri-apps/plugin-store");
  return Store.load("params.json");
}

// ============================================================
// 浏览器环境：使用 localStorage（仅供开发预览）
// ============================================================

function loadFromLocalStorage(): UserParams | null {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(params: UserParams): void {
  localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

function clearLocalStorage(): void {
  localStorage.removeItem(PARAMS_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

function getLastSyncFromLocalStorage(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// ============================================================
// 统一 API
// ============================================================

/** 加载已保存的用户参数 */
export async function loadParams(): Promise<UserParams | null> {
  if (isTauri()) {
    const store = await getTauriStore();
    return (await store.get<UserParams>(PARAMS_KEY)) ?? null;
  }
  return loadFromLocalStorage();
}

/** 保存用户参数 */
export async function saveParams(params: UserParams): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore();
    await store.set(PARAMS_KEY, params);
    await store.set(LAST_SYNC_KEY, new Date().toISOString());
    await store.save();
    return;
  }
  saveToLocalStorage(params);
}

/** 清除用户参数 */
export async function clearParams(): Promise<void> {
  if (isTauri()) {
    const store = await getTauriStore();
    await store.delete(PARAMS_KEY);
    await store.delete(LAST_SYNC_KEY);
    await store.save();
    return;
  }
  clearLocalStorage();
}

/** 获取上次同步时间 */
export async function getLastSyncAt(): Promise<string | null> {
  if (isTauri()) {
    const store = await getTauriStore();
    return (await store.get<string>(LAST_SYNC_KEY)) ?? null;
  }
  return getLastSyncFromLocalStorage();
}
