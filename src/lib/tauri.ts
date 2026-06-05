/**
 * 检测是否在 Tauri 环境中运行
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 获取 Tauri invoke 函数（仅在 Tauri 环境可用）
 */
export async function getInvoke() {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke;
  }
  throw new Error("Tauri API not available in browser");
}
