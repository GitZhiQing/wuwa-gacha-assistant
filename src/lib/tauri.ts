// ============================================================
// 环境检测 / Tauri API 封装
// ============================================================

/** 模块级缓存 — Tauri 环境在运行时不会改变 */
let _isTauri: boolean | null = null;

/**
 * 检测是否在 Tauri 环境中运行
 */
export function isTauri(): boolean {
  if (_isTauri === null) {
    _isTauri =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }
  return _isTauri;
}

/** 模块级缓存 — invoke 函数 */
let _invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

/**
 * 获取 Tauri invoke 函数（仅在 Tauri 环境可用）
 */
export async function getInvoke() {
  if (isTauri()) {
    if (!_invoke) {
      const { invoke } = await import("@tauri-apps/api/core");
      _invoke = invoke;
    }
    return _invoke;
  }
  throw new Error("Tauri API not available in browser");
}
