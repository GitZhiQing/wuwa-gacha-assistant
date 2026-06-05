import type { PoolTypeInfo } from "./types";

// ============================================================
// 常驻五星角色（5 位）
// ============================================================
export const STANDARD_FIVE_STAR_CHARS: string[] = [
  "维里奈",
  "安可",
  "卡卡罗",
  "鉴心",
  "凌阳",
];

// ============================================================
// 限定五星角色（按首次登场时间排序）
// ============================================================
export const LIMITED_FIVE_STAR_CHARS: string[] = [
  "忌炎",
  "吟霖",
  "今汐",
  "长离",
  "折枝",
  "相里要",
  "守岸人",
  "椿",
  "洛可可",
  "菲比",
  "布兰特",
  "坎特蕾拉",
  "夏空",
  "赞妮",
  "卡提希娅",
  "露帕",
  "弗洛洛",
  "珂莱塔",
  "奥古斯塔",
  "尤诺",
  "莫宁",
  "千咲",
  "仇远",
  "琳奈",
  "嘉贝莉娜",
  "爱弥斯",
  "西格莉卡",
  "绯雪",
  "达妮娅",
  "陆·赫斯",
];

// ============================================================
// 限定五星角色 Set（快速查找用）
// ============================================================
export const LIMITED_CHAR_SET = new Set(LIMITED_FIVE_STAR_CHARS);
export const STANDARD_CHAR_SET = new Set(STANDARD_FIVE_STAR_CHARS);

// ============================================================
// 卡池类型元数据
// ============================================================
export const POOL_TYPE_MAP: Record<number, PoolTypeInfo> = {
  1: {
    type: 1,
    name: "角色活动唤取",
    isLimited: true,
    hasWarp: true,
    resourceType: "角色",
    tabLabel: "角色唤取",
  },
  2: {
    type: 2,
    name: "武器活动唤取",
    isLimited: true,
    hasWarp: false,
    resourceType: "武器",
    tabLabel: "武器唤取",
  },
  3: {
    type: 3,
    name: "角色常驻唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "角色",
    tabLabel: "常驻角色",
  },
  4: {
    type: 4,
    name: "武器常驻唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "武器",
    tabLabel: "常驻武器",
  },
  5: {
    type: 5,
    name: "新手唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "角色",
    tabLabel: "新手唤取",
  },
  6: {
    type: 6,
    name: "新手自选唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "角色",
    tabLabel: "新手自选",
  },
  7: {
    type: 7,
    name: "角色新旅唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "角色",
    tabLabel: "角色新旅",
  },
  8: {
    type: 8,
    name: "武器新旅唤取",
    isLimited: false,
    hasWarp: false,
    resourceType: "武器",
    tabLabel: "武器新旅",
  },
  9: {
    type: 9,
    name: "角色联动唤取",
    isLimited: true,
    hasWarp: true,
    resourceType: "角色",
    tabLabel: "联动角色",
  },
  10: {
    type: 10,
    name: "武器联动唤取",
    isLimited: true,
    hasWarp: false,
    resourceType: "武器",
    tabLabel: "联动武器",
  },
};

/** 所有卡池类型 */
export const ALL_POOL_TYPES = Object.keys(POOL_TYPE_MAP).map(Number);

/** 分析 Tab 中展示的卡池（排除新手/新旅等非核心池） */
export const ANALYSIS_TAB_POOLS = [1, 2, 9, 10, 3, 4];

/** 被视为"限定"的卡池类型 */
export const LIMITED_POOL_TYPES = [1, 2, 9, 10];
