import type {
  GachaRecordRow,
  FiveStarEntry,
  OverviewStats,
  PoolAnalysis,
} from "./types";
import {
  LIMITED_CHAR_SET,
  STANDARD_CHAR_SET,
  POOL_TYPE_MAP,
  LIMITED_POOL_TYPES,
} from "./constants";

// ============================================================
// 卡池分析
// ============================================================

/**
 * 分析单个卡池：计算保底、歪卡、统计
 * @param records 按 sort_order ASC 排序的记录
 * @param poolType 卡池类型
 */
export function analyzePool(
  records: GachaRecordRow[],
  poolType: number
): PoolAnalysis {
  const info = POOL_TYPE_MAP[poolType];
  const poolName = info?.name ?? `卡池类型 ${poolType}`;
  const hasWarp = info?.hasWarp ?? false;

  const fiveStarEntries = calculatePity(records, hasWarp);
  const totalFiveStars = fiveStarEntries.length;
  const lostCount = fiveStarEntries.filter((e) => e.isLost50_50).length;

  // 平均出货抽数
  const avgPity =
    totalFiveStars > 0
      ? Math.round(
          (fiveStarEntries.reduce((s, e) => s + e.pityCount, 0) /
            totalFiveStars) *
            10
        ) / 10
      : 0;

  // 当前保底状态
  const { count: currentPity, guarantee: currentGuarantee } =
    getCurrentPity(records, hasWarp);

  return {
    poolName,
    poolType,
    totalPulls: records.length,
    fiveStarEntries,
    totalFiveStars,
    lostCount,
    avgPity,
    currentPity,
    currentGuarantee,
  };
}

/**
 * 计算保底和歪卡
 *
 * 遍历所有记录（从旧到新），每当遇到五星时记录：
 * - pityCount: 距上次五星的抽数
 * - isLost50_50: 是否歪卡（仅 hasWarp 池）
 * - wasGuaranteed: 是否在大保底
 */
function calculatePity(
  records: GachaRecordRow[],
  hasWarp: boolean
): FiveStarEntry[] {
  const entries: FiveStarEntry[] = [];
  let pityCounter = 0;
  let guarantee = false; // 是否在大保底状态

  for (const r of records) {
    pityCounter++;

    if (r.quality === 5 && r.res_type === "角色") {
      let isLimited = LIMITED_CHAR_SET.has(r.name);
      let isLost50_50 = false;
      let wasGuaranteed = false;

      // 角色活动唤取(1) 和 联动角色(9) 均适用 50/50 机制
      if (hasWarp && (r.pool_type === 1 || r.pool_type === 9)) {
        if (guarantee) {
          // 大保底状态：必出限定
          wasGuaranteed = true;
          guarantee = false;
        } else {
          // 小保底状态
          if (isLimited) {
            // 没歪
            guarantee = false;
          } else if (STANDARD_CHAR_SET.has(r.name)) {
            // 歪了
            isLost50_50 = true;
            wasGuaranteed = false;
            guarantee = true;
          }
          // else: 既不是限定也不是常驻角色（不应发生，保守处理）
        }
      }

      entries.push({
        name: r.name,
        resourceType: "角色",
        pityCount: pityCounter,
        isLimited,
        isLost50_50,
        wasGuaranteed,
        sortOrder: r.sort_order,
        time: r.pull_time,
      });

      pityCounter = 0;
    }

    // 武器池五星（不需要歪卡分析，记录即可）
    if (r.quality === 5 && r.res_type === "武器") {
      entries.push({
        name: r.name,
        resourceType: "武器",
        pityCount: pityCounter,
        isLimited: true, // 限定武器池 100% UP
        isLost50_50: false,
        wasGuaranteed: false,
        sortOrder: r.sort_order,
        time: r.pull_time,
      });
      pityCounter = 0;
    }
  }

  return entries;
}

// ============================================================
// 当前保底状态
// ============================================================

/**
 * 计算当前保底状态
 * @returns 已垫抽数 + 是否大保底
 */
function getCurrentPity(
  records: GachaRecordRow[],
  hasWarp: boolean
): { count: number; guarantee: boolean } {
  let pityCounter = 0;
  let guarantee = false;

  for (const r of records) {
    pityCounter++;

    if (r.quality === 5 && r.res_type === "角色") {
      if (hasWarp) {
        if (guarantee) {
          guarantee = false;
        } else if (STANDARD_CHAR_SET.has(r.name)) {
          guarantee = true;
        } else {
          guarantee = false;
        }
      }
      pityCounter = 0;
    }

    if (r.quality === 5 && r.res_type === "武器") {
      pityCounter = 0;
    }
  }

  return { count: pityCounter, guarantee };
}

// ============================================================
// 概览统计
// ============================================================

/**
 * 计算全局概览统计
 */
export function calculateOverview(
  analyses: Map<number, PoolAnalysis>,
  allRecords: Map<number, GachaRecordRow[]>
): OverviewStats {
  let totalPulls = 0;
  let totalLimitedPulls = 0;
  let totalFiveStarChars = 0;
  let totalFiveStarPulls = 0;
  let totalLimitedCharPulls = 0;
  let totalLimitedWeaponPulls = 0;
  const ownedLimitedChars = new Set<string>();
  const ownedLimitedWeapons = new Set<string>();
  const ownedStandardChars = new Set<string>();
  const ownedStandardWeapons = new Set<string>();

  for (const [poolType, records] of allRecords) {
    totalPulls += records.length;

    if (LIMITED_POOL_TYPES.includes(poolType)) {
      totalLimitedPulls += records.length;
    }

    const analysis = analyses.get(poolType);
    if (!analysis) continue;

    const info = POOL_TYPE_MAP[poolType];
    if (!info) continue;

    for (const entry of analysis.fiveStarEntries) {
      totalFiveStarPulls += entry.pityCount;

      if (entry.resourceType === "角色") {
        totalFiveStarChars++;
        if (entry.isLimited) {
          ownedLimitedChars.add(entry.name);
        } else {
          ownedStandardChars.add(entry.name);
        }

        if (info.isLimited) {
          totalLimitedCharPulls += entry.pityCount;
        }
      } else {
        // 武器
        if (info.isLimited) {
          ownedLimitedWeapons.add(entry.name);
          totalLimitedWeaponPulls += entry.pityCount;
        } else {
          ownedStandardWeapons.add(entry.name);
        }
      }
    }
  }

  const limitedCharCount = [...analyses.values()]
    .filter((a) => {
      const info = POOL_TYPE_MAP[a.poolType];
      return info?.resourceType === "角色" && info?.isLimited;
    })
    .reduce((s, a) => s + a.fiveStarEntries.filter((e) => e.isLimited).length, 0);

  const limitedWeaponCount = [...analyses.values()]
    .filter((a) => {
      const info = POOL_TYPE_MAP[a.poolType];
      return info?.resourceType === "武器" && info?.isLimited;
    })
    .reduce((s, a) => s + a.totalFiveStars, 0);

  return {
    totalPulls,
    totalLimitedPulls,
    avgPullsPerFiveStar:
      totalFiveStarChars > 0
        ? Math.round((totalLimitedCharPulls / totalFiveStarChars) * 10) / 10
        : 0,
    avgPullsPerLimitedChar:
      limitedCharCount > 0
        ? Math.round((totalLimitedCharPulls / limitedCharCount) * 10) / 10
        : 0,
    avgPullsPerLimitedWeapon:
      limitedWeaponCount > 0
        ? Math.round((totalLimitedWeaponPulls / limitedWeaponCount) * 10) / 10
        : 0,
    ownedLimitedChars: [...ownedLimitedChars],
    ownedLimitedWeapons: [...ownedLimitedWeapons],
    ownedStandardChars: [...ownedStandardChars],
    ownedStandardWeapons: [...ownedStandardWeapons],
  };
}

// ============================================================
// 批量分析（一次性处理所有卡池）
// ============================================================

/**
 * 对所有卡池运行分析
 */
export function runFullAnalysis(
  allRecords: Map<number, GachaRecordRow[]>
): {
  poolAnalyses: Map<number, PoolAnalysis>;
  overview: OverviewStats;
} {
  const poolAnalyses = new Map<number, PoolAnalysis>();

  for (const [poolType, records] of allRecords) {
    poolAnalyses.set(poolType, analyzePool(records, poolType));
  }

  const overview = calculateOverview(poolAnalyses, allRecords);

  return { poolAnalyses, overview };
}
