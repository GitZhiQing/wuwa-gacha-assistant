// ============================================================
// API 原始数据类型
// ============================================================

/** Rust 端返回的单条抽卡记录（camelCase，匹配 Rust serde 序列化） */
export interface GachaRecord {
  cardPoolType: string;
  resourceId: number;
  qualityLevel: number;
  resourceType: string;
  name: string;
  count: number;
  time: string;
}

/** 单个卡池的 API 响应 */
export interface PoolApiResponse {
  pool_type: number;
  pool_name: string;
  records: GachaRecord[];
  error: string | null;
}

// ============================================================
// SQLite 行类型
// ============================================================

/** gacha_records 表行 */
export interface GachaRecordRow {
  id: number;
  user_id: string;
  pool_type: number;
  pool_name: string;
  resource_id: number;
  quality: number;
  res_type: string;
  name: string;
  pull_time: string;
  sort_order: number;
  created_at: string;
}

/** sync_meta 表行 */
export interface SyncMeta {
  user_id: string;
  pool_type: number;
  total_count: number;
  last_sync_at: string;
}

// ============================================================
// 业务数据类型
// ============================================================

/** 分析后的五星条目 */
export interface FiveStarEntry {
  name: string;
  resourceType: "角色" | "武器";
  pityCount: number;
  isLimited: boolean;
  isLost50_50: boolean;
  wasGuaranteed: boolean;
  sortOrder: number;
  time: string;
}

/** 概览统计 */
export interface OverviewStats {
  totalPulls: number;
  totalFiveStars: number;
  avgPity: number;
  ownedLimitedChars: string[];
  ownedLimitedWeapons: string[];
  ownedStandardChars: string[];
  ownedStandardWeapons: string[];
}

/** 单个卡池的分析结果 */
export interface PoolAnalysis {
  poolName: string;
  poolType: number;
  totalPulls: number;
  fiveStarEntries: FiveStarEntry[];
  totalFiveStars: number;
  lostCount: number;
  avgPity: number;
  currentPity: number;
  currentGuarantee: boolean;
}

/** 用户参数 */
export interface UserParams {
  playerId: string;
  serverId: string;
  cardPoolId: string;
  recordId: string;
}

/** 卡池类型信息 */
export interface PoolTypeInfo {
  type: number;
  name: string;
  isLimited: boolean;
  hasWarp: boolean; // 是否有 50/50 歪卡机制
  resourceType: "角色" | "武器";
  tabLabel: string;
}
