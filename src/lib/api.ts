import { isTauri } from "./tauri";

export interface GachaRecord {
  cardPoolType: string;
  resourceId: number;
  qualityLevel: number;
  resourceType: string;
  name: string;
  count: number;
  time: string;
}

export interface PoolApiResponse {
  pool_type: number;
  pool_name: string;
  records: GachaRecord[];
  error: string | null;
}

export interface FetchParams {
  playerId: string;
  serverId: string;
  cardPoolId: string;
  recordId: string;
  poolTypes: number[];
}

/**
 * 调用 Rust 后端拉取抽卡数据（仅在 Tauri 环境可用）
 */
export async function fetchGachaData(
  params: FetchParams
): Promise<PoolApiResponse[]> {
  if (!isTauri()) {
    throw new Error(
      "API 拉取仅在 Tauri 桌面应用中可用。请使用 npm run tauri dev 启动。"
    );
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<PoolApiResponse[]>("fetch_gacha_data", {
    playerId: params.playerId,
    serverId: params.serverId,
    cardPoolId: params.cardPoolId,
    recordId: params.recordId,
    poolTypes: params.poolTypes,
  });
}
