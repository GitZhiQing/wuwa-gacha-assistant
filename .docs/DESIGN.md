# 鸣潮抽卡助手 — 开发思路与需求分析

## 项目概述

**Tauri 桌面应用**，用户输入请求参数，应用通过官方 API 获取抽卡数据，本地分析生成抽卡报告。

技术栈：**Next.js + shadcn/ui + Tauri**

---

## 一、为什么要用 Tauri？

| 原因 | 说明 |
|------|------|
| 绕过 CORS | 官方 API (`gmserver-api.aki-game2.com`) 不允许浏览器跨域调用，Tauri 的 Rust 后端可以发送 HTTP 请求 |
| 本地持久化 | 抽卡数据存入 SQLite，用户参数通过 Store 插件持久化，数据存在 Tauri `app_data_dir` |
| 桌面体验 | 窗口管理、系统托盘、离线使用等桌面应用特性 |

### 1.1 需要的 Tauri 插件

| 插件 | 用途 | Rust crate | JS 包 |
|------|------|-----------|-------|
| **SQL** | SQLite 数据库，存储抽卡记录 | `tauri-plugin-sql` (features: `sqlite`) | `@tauri-apps/plugin-sql` |
| **Store** | 持久化用户参数（playerId 等），键值存储 | `tauri-plugin-store` | `@tauri-apps/plugin-store` |
| **HTTP** | Rust 端发送 HTTP 请求到官方 API（绕过 CORS） | `tauri-plugin-http` | — |
| **FS** | 可选：文件系统访问 | `tauri-plugin-fs` | `@tauri-apps/plugin-fs` |

### 1.2 Rust 端初始化 (src-tauri/src/lib.rs)

```rust
fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
``` |

---

## 二、数据来源

### 2.1 API 说明

```
POST https://gmserver-api.aki-game2.com/gacha/record/query
```

请求参数（见 `test.py`）：
- `playerId` — 玩家 ID
- `cardPoolId` — 卡池 ID
- `cardPoolType` — 卡池类型 (1~10)
- `serverId` — 服务器 ID
- `recordId` — 记录 ID
- `languageCode` — 语言

### 2.2 10 种卡池类型

| cardPoolType | 名称 | 说明 |
|---|---|---|
| 1 | 角色活动唤取 | 限定角色池（会歪） |
| 2 | 武器活动唤取 | 限定武器池（不歪） |
| 3 | 角色常驻唤取 | 常驻角色 |
| 4 | 武器常驻唤取 | 常驻武器 |
| 5 | 新手唤取 | 新手池 |
| 6 | 新手自选唤取 | 新手自选 |
| 7 | 角色新旅唤取 | 新旅角色 |
| 8 | 武器新旅唤取 | 新旅武器 |
| 9 | 角色联动唤取 | 联动角色（3.4 版本） |
| 10 | 武器联动唤取 | 联动武器（3.4 版本） |

### 2.3 单条记录的数据结构

```json
{
  "cardPoolType": "角色精准调谐",
  "resourceId": 1211,
  "qualityLevel": 5,
  "resourceType": "角色",
  "name": "达妮娅",
  "count": 1,
  "time": "2026-05-23 03:17:57"
}
```

- `qualityLevel`: 5 = 五星, 4 = 四星, 3 = 三星
- `resourceType`: "角色" 或 "武器"
- 记录按时间**倒序**排列（最新在前）

### 2.4 ⚠️ 10 连抽时间戳问题

游戏支持 10 连抽，**10 连中的 10 条记录具有完全相同的时间戳**（精确到秒）。因此：
- **不能仅靠时间戳排序** —— 必须保留 API 返回的**原始顺序**
- 分析保底/歪卡时，必须按 API 原始顺序（从旧到新）逐条遍历
- 增量写入时，相同时间戳的记录不能简单用 `time > last_time` 判定新/旧
- 具体增量策略见「数据库设计」章节

---

## 三、卡池规则（领域知识）

### 3.1 通用规则
- 五星基础概率 **0.8%**，硬保底 **80 抽**必出五星
- 保底跨期继承：同类型池之间继承，不同类型互不影响

### 3.2 限定角色池 — 会歪（核心复杂逻辑）

```
50/50 机制：
  - 小保底（无 guarantee）：50% 当期 UP，50% 常驻五星
  - 大保底（有 guarantee）：100% 当期 UP（上一金歪了）

最坏情况：160 抽（80 抽歪 + 再 80 抽出 UP）
```

**5 位常驻五星角色**：维里奈、安可、卡卡罗、鉴心、凌阳

**歪卡分析算法**：
```
pity = 0
guarantee = false  // 是否处于大保底状态

for each pull (从旧到新):
    pity++
    if qualityLevel == 5:
        if guarantee == true:
            → 本次必出 UP，记录"不歪"，pity 清零
            guarantee = false
        else if name 是限定角色:
            → 小保底没歪，记录"不歪"，pity 清零
            guarantee = false
        else:
            → 小保底歪了，记录"歪卡"，pity 清零
            guarantee = true  // 下一金大保底
```

### 3.3 限定武器池 — 不歪
- 五星必为当期 UP 武器
- 不需要歪卡分析

### 3.4 常驻池
- 角色常驻：无 UP，随机常驻五星
- 武器常驻：可自选目标，80 抽保底出选定武器

### 3.5 联动卡池
- 3.4 版本新增，完全独立保底

---

## 四、页面设计

### 4.1 数据导入页 (`/import`)

```
┌────────────────────────────────────────┐
│  数据导入                               │
│                                        │
│  ┌─────────────────────────────┐       │
│  │ playerId    [____________]  │       │
│  │ serverId    [____________]  │       │
│  │ cardPoolId  [____________]  │       │
│  │ recordId    [____________]  │       │
│  └─────────────────────────────┘       │
│                                        │
│  选择要拉取的卡池：                       │
│  ☑ 角色活动唤取   ☑ 武器活动唤取          │
│  ☐ 角色常驻唤取   ☐ 武器常驻唤取          │
│  ☐ 新手唤取      ☐ 新手自选唤取          │
│  ☐ 角色新旅唤取   ☐ 武器新旅唤取          │
│  ☐ 角色联动唤取   ☐ 武器联动唤取          │
│                                        │
│  [  一键拉取  ]                         │
│                                        │
│  拉取进度：角色活动唤取 ✅  武器活动唤取 ⏳... │
└────────────────────────────────────────┘
```

### 4.2 概览面板 (`/`)

```
┌──────────────────────────────────────────┐
│  概览                                     │
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 总抽数  │ │限定抽数 │ │五星平均 │  ...  │
│  │  682   │ │  450   │ │  55.3  │       │
│  └────────┘ └────────┘ └────────┘       │
│                                          │
│  拥有的限定五星角色                         │
│  ┌──────────────────────────────────┐    │
│  │ [达妮娅] [绯雪] [西格莉卡] [仇远] ... │    │
│  └──────────────────────────────────┘    │
│                                          │
│  拥有的限定五星武器                         │
│  ┌──────────────────────────────────┐    │
│  │ [灼霜] [昭日译注] ...               │    │
│  └──────────────────────────────────┘    │
│                                          │
│  拥有的常驻五星角色       常驻五星武器       │
│  ┌──────────────┐ ┌──────────────┐       │
│  │ [维里奈]     │ │ [xxx]        │       │
│  │ [安可]       │ │              │       │
│  └──────────────┘ └──────────────┘       │
└──────────────────────────────────────────┘
```

**9 项统计指标**：
1. 总抽数（所有卡池）
2. 总限定抽数（仅限定卡池）
3. 五星角色平均抽数
4. 五星限定角色平均抽数
5. 五星限定武器平均抽数
6. 拥有的限定五星角色
7. 拥有的限定五星武器
8. 拥有的常驻五星角色
9. 拥有的常驻五星武器

### 4.3 卡池分析页 (`/analysis`)

```
┌──────────────────────────────────────────┐
│  卡池分析                                  │
│                                          │
│  [角色唤取] [武器唤取] [联动角色] [联动武器]   │
│  [常驻角色] [常驻武器]                      │
│  ─────────────────────────────────────── │
│                                          │
│  限定角色唤取 · 达妮娅池                    │
│                                          │
│  ┌─ 统计概览 ──────────────────────────┐  │
│  │ 总抽数: 450  五星数: 8             │  │
│  │ 歪卡率: 37.5% (3/8)               │  │
│  │ 平均出五星: 56.3 抽               │  │
│  │ 当前状态: 小保底 (已垫 23 抽)       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ 保底分布图 (柱状图) ───────────────┐  │
│  │  ██                                │  │
│  │  ██  ██                            │  │
│  │  ██  ██  ██  ██                    │  │
│  │  10  30  50  70  80  (抽出货抽数)    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ 五星记录表 ────────────────────────┐  │
│  │ # │ 名称  │ 限定?│歪卡?│距上金│时间 │  │
│  │ 1 │ 达妮娅│  ✓  │  ✗  │  78  │ ... │  │
│  │ 2 │ 维里奈│  ✗  │  ✓  │  34  │ ... │  │
│  │ 3 │ 达妮娅│  ✓  │  ✗  │  80  │ ... │  │
│  │ 4 │ 绯雪  │  ✓  │  ✗  │  52  │ ... │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 五、项目文件结构

```
wuwa-gacha-assistant/
├── src-tauri/                    # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs              # 入口，插件注册
│   │   ├── lib.rs               # Tauri Builder + command 注册
│   │   ├── gacha.rs             # API 调用：POST 请求 + 响应解析
│   │   └── db.rs                # SQLite 操作：建表、增量写入、查询
│   ├── Cargo.toml               # 依赖：tauri-plugin-sql, tauri-plugin-store, tauri-plugin-http
│   └── tauri.conf.json
│
├── src/                          # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx           # 根布局 (Sidebar + 内容区)
│   │   ├── page.tsx             # 概览面板 (Overview)
│   │   ├── import/
│   │   │   └── page.tsx         # 数据导入（首次输入参数，之后自动记住）
│   │   └── analysis/
│   │       └── page.tsx         # 卡池分析 (Tab 切换)
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 组件 (自动生成)
│   │   ├── overview/
│   │   │   ├── StatCard.tsx     # 统计卡片
│   │   │   └── OwnedList.tsx    # 拥有列表
│   │   ├── analysis/
│   │   │   ├── PoolTabs.tsx     # 卡池 Tab 切换
│   │   │   ├── FiveStarTable.tsx # 五星记录表
│   │   │   ├── PityChart.tsx    # 保底分布图 (Recharts)
│   │   │   └── PoolStats.tsx    # 池统计面板
│   │   ├── import/
│   │   │   ├── PlayerForm.tsx   # 玩家参数表单（首次填写）
│   │   │   └── PoolSelector.tsx # 卡池多选
│   │   └── layout/
│   │       └── Sidebar.tsx      # 侧边导航栏
│   │
│   ├── lib/
│   │   ├── gacha-analysis.ts    # ★ 核心分析算法（纯函数）
│   │   ├── constants.ts         # ★ 领域知识（角色/武器名单）
│   │   ├── db.ts                # 前端 SQLite 操作封装（基于 @tauri-apps/plugin-sql）
│   │   ├── api.ts               # Tauri invoke 封装（触发 Rust 端拉取）
│   │   └── types.ts             # TypeScript 类型定义
│   │
│   ├── store/
│   │   ├── gacha-store.ts       # Zustand：抽卡数据 + 分析结果
│   │   └── user-store.ts        # Zustand：用户参数（从 Store 插件加载/保存）
│   │
│   └── hooks/
│       ├── useGachaData.ts      # 从 SQLite 加载数据到内存
│       └── useUserParams.ts     # 从 Store 插件加载用户参数
│
├── data/                         # 已有的 JSON 示例数据（参考）
├── .docs/                        # 需求文档
├── pyproject.toml
├── test.py                       # Python 数据拉取脚本（参考）
└── README.md
```

---

## 六、核心数据流

```
                    ┌──────────────┐
                    │ Store 插件    │  持久化用户参数
                    │ (playerId 等) │  (app_data_dir/params.json)
                    └──────┬───────┘
                           │ 首次填写后记住
                           ▼
用户打开应用 → 自动加载已保存参数 → 直接点击"同步数据"
                           │
                           ▼
┌─────────────────┐
│  Rust 后端       │  Tauri Command: fetch_gacha_data
│  (reqwest)       │  POST → 官方 API (10 次，每种卡池一次)
│                  │  ◄──── JSON 响应
└────────┬────────┘
         │ 解析响应，返回给前端
         ▼
┌─────────────────┐
│  前端 JS 层      │  收到新记录后：
│  (lib/db.ts)    │  1. 对比 SQLite 已有记录数
│                  │  2. 算出增量 delta
│                  │  3. INSERT 新记录（保留 API 原始顺序）
└────────┬────────┘
         │ 增量写入
         ▼
┌─────────────────┐
│  SQLite          │  存储所有抽卡记录
│  (app_data_dir/  │  表: gacha_records, sync_meta
│   gacha.db)      │
└────────┬────────┘
         │ 前端用 @tauri-apps/plugin-sql 直接查询
         ▼
┌─────────────────┐
│  gacha-analysis  │  从 SQLite 读取 → 纯函数计算
│  (纯函数)        │  → 保底分析 / 歪卡判定 / 统计聚合
└────────┬────────┘
         │ 结果写入 Zustand Store
         ▼
┌─────────────────┐
│  React 组件     │  渲染概览 + 卡池分析 + 图表
└─────────────────┘
```

### 6.1 用户参数持久化流程

```
首次使用:
  用户填写 PlayerForm (playerId, serverId, cardPoolId, recordId)
    → 保存到 Store 插件 (tauri-plugin-store)
    → 写入 app_data_dir/params.json

后续使用:
  应用启动 → useUserParams Hook 从 Store 加载参数
    → 参数有效：直接进入概览页，一键同步
    → 参数失效 (API 返回 4xx)：弹出表单要求重新输入
```

---

## 七、SQLite 数据库设计

### 7.1 表结构

```sql
-- 抽卡记录主表
CREATE TABLE IF NOT EXISTS gacha_records (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT    NOT NULL,          -- 玩家 ID (playerId)
    pool_type   INTEGER NOT NULL,          -- 卡池类型 1-10
    pool_name   TEXT    NOT NULL,          -- "角色活动唤取" 等
    resource_id INTEGER NOT NULL,          -- 物品 ID
    quality     INTEGER NOT NULL,          -- 3/4/5 星
    res_type    TEXT    NOT NULL,          -- "角色" / "武器"
    name        TEXT    NOT NULL,          -- 物品名称
    pull_time   TEXT    NOT NULL,          -- 抽卡时间 "2026-05-23 03:17:57"
    sort_order  INTEGER NOT NULL,          -- ★ API 原始顺序（从旧到新，0-based）
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 同步元数据表（追踪每个卡池的同步状态，用于增量写入）
CREATE TABLE IF NOT EXISTS sync_meta (
    user_id       TEXT PRIMARY KEY,         -- 玩家 ID
    pool_type     INTEGER NOT NULL,         -- 卡池类型
    total_count   INTEGER NOT NULL DEFAULT 0,  -- 当前该池总记录数
    last_sync_at  TEXT    NOT NULL,         -- 最后同步时间
    PRIMARY KEY (user_id, pool_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pool_type ON gacha_records(user_id, pool_type);
CREATE INDEX IF NOT EXISTS idx_pull_time ON gacha_records(user_id, pool_type, pull_time);
CREATE INDEX IF NOT EXISTS idx_sort_order ON gacha_records(user_id, pool_type, sort_order);
```

### 7.2 增量写入策略

**核心问题**：API 每次返回该卡池的**全部记录**（非增量），且 10 连记录时间戳相同，如何只写入新记录？

**策略 — 基于计数比较 + API 原始顺序**：

```
// 前端收到 API 响应后（Rust 端透传原始 JSON data[] 数组）
function incrementalInsert(db, userId, poolType, apiRecords):
    // apiRecords: API 返回的数组，保持原始顺序（index 0 = 最新）
    
    // 1. 查当前该池已有记录数
    existingCount = db.select(
        "SELECT total_count FROM sync_meta WHERE user_id = $1 AND pool_type = $2",
        [userId, poolType]
    )
    
    // 2. 计算新增数
    apiTotal = apiRecords.length
    newCount = apiTotal - existingCount
    
    if newCount <= 0:
        return  // 没有新数据
    
    // 3. ★ 关键：取 API 数组的前 newCount 条（最新记录）
    //    因为 API 按时间倒序返回，最新的在前面
    newRecords = apiRecords.slice(0, newCount)
    
    // 4. 倒序插入，使 sort_order 从旧到新递增
    //    lastSortOrder = 当前该池最大 sort_order（没有则为 -1）
    lastSortOrder = db.select(
        "SELECT MAX(sort_order) FROM gacha_records WHERE user_id = $1 AND pool_type = $2",
        [userId, poolType]
    ) || -1
    
    for (i = newRecords.length - 1; i >= 0; i--):  // 从旧到新
        lastSortOrder++
        db.execute(
            "INSERT INTO gacha_records (...) VALUES (...)",
            [..., lastSortOrder]
        )
    
    // 5. 更新同步元数据
    db.execute(
        "INSERT OR REPLACE INTO sync_meta (user_id, pool_type, total_count, last_sync_at)
         VALUES ($1, $2, $3, datetime('now'))",
        [userId, poolType, apiTotal]
    )
```

**为什么这个策略有效**：
- API 总是返回该卡池的完整记录集，且记录只会增加不会减少
- 新抽的记录一定在 API 响应数组的**最前面**（最新时间）
- 即使用户一次 10 连产生 10 条时间戳相同的记录，它们也都在 API 数组的前 10 位，并且 API 已经保持了正确的先后顺序
- 我们只需要取 `apiTotal - existingCount` 条最新记录即可

### 7.3 sort_order 的作用

`sort_order` 是从 0 开始递增的整数，表示该记录在该卡池中的**绝对位置**（从旧到新）。

- 读取分析时：`ORDER BY sort_order ASC` 即得到正确的抽卡时间线
- 增量写入时：新记录的 sort_order 接在已有记录的最大值之后
- **这个字段解决了 10 连时间戳相同导致的排序歧义问题**

### 7.4 多用户支持

虽然实际场景通常只有 1 个用户，但设计上通过 `user_id` 列区分：
- 所有查询带 `WHERE user_id = $1 AND pool_type = $2`
- 不同 `playerId` 的数据完全隔离
- 如果将来需要切换账号，只需更换 user_id

### 7.5 前端使用 SQLite 的方式

```typescript
// src/lib/db.ts
import Database from '@tauri-apps/plugin-sql';

const DB_PATH = 'sqlite:gacha.db';  // 自动存到 app_data_dir

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(DB_PATH);
    await initSchema(db);
  }
  return db;
}

async function initSchema(db: Database) {
  await db.execute(`CREATE TABLE IF NOT EXISTS gacha_records (...)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS sync_meta (...)`);
}

// API 拉取后增量写入
export async function saveRecords(userId: string, poolType: number, 
                                   poolName: string, apiRecords: GachaRecord[]) {
  const db = await getDb();
  // ... 实现上述增量逻辑
}

// 读取某卡池所有记录（按抽卡顺序）
export async function loadRecords(userId: string, poolType: number): Promise<GachaRecord[]> {
  const db = await getDb();
  return db.select(
    'SELECT * FROM gacha_records WHERE user_id = $1 AND pool_type = $2 ORDER BY sort_order ASC',
    [userId, poolType]
  );
}
```

---

## 八、核心类型定义

```typescript
// 单条抽卡记录（API 返回格式）
interface GachaRecord {
  cardPoolType: string;     // "角色精准调谐" 等
  resourceId: number;
  qualityLevel: 3 | 4 | 5;
  resourceType: "角色" | "武器";
  name: string;
  count: 1;
  time: string;             // "2026-05-23 03:17:57"
}

// SQLite 行类型（多了 sort_order）
interface GachaRecordRow extends GachaRecord {
  id: number;
  user_id: string;
  pool_type: number;
  pool_name: string;
  quality: number;
  res_type: string;
  pull_time: string;
  sort_order: number;
  created_at: string;
}

// 分析后的五星条目
interface FiveStarEntry {
  name: string;
  resourceType: "角色" | "武器";
  pityCount: number;        // 距上次五星的抽数
  isLimited: boolean;       // 是否限定
  isLost50_50: boolean;     // 是否歪卡（仅角色池有意义）
  wasGuaranteed: boolean;   // 出货时是否在大保底
  sortOrder: number;        // 在卡池中的绝对位置
  time: string;
}

// 概览统计
interface OverviewStats {
  totalPulls: number;
  totalLimitedPulls: number;
  avgPullsPerFiveStar: number;
  avgPullsPerLimitedChar: number;
  avgPullsPerLimitedWeapon: number;
  ownedLimitedChars: string[];
  ownedLimitedWeapons: string[];
  ownedStandardChars: string[];
  ownedStandardWeapons: string[];
}

// 单个卡池的分析结果
interface PoolAnalysis {
  poolName: string;
  poolType: number;
  totalPulls: number;
  fiveStarEntries: FiveStarEntry[];
  totalFiveStars: number;
  lostCount: number;         // 歪卡次数（仅角色池）
  avgPity: number;           // 平均出五星抽数
  currentPity: number;       // 当前已垫抽数
  currentGuarantee: boolean; // 当前是否大保底
}
```

---

## 九、领域知识常量

```typescript
// 常驻五星角色（5 位）
const STANDARD_FIVE_STAR_CHARS = [
  "维里奈", "安可", "卡卡罗", "鉴心", "凌阳"
];

// 限定五星角色（从卡池时间文档提取）
const LIMITED_FIVE_STAR_CHARS = [
  "忌炎", "吟霖", "今汐", "长离", "折枝", "相里要",
  "守岸人", "椿", "洛可可", "菲比", "布兰特", "坎特蕾拉",
  "夏空", "赞妮", "卡提希娅", "露帕", "弗洛洛", "珂莱塔",
  "奥古斯塔", "尤诺", "莫宁", "千咲", "仇远", "琳奈",
  "嘉贝莉娜", "爱弥斯", "西格莉卡", "绯雪", "达妮娅", "陆·赫斯"
];

// 注意：角色池可能出现五星武器（常驻五星武器），需要确认名单
// 常驻五星武器通常为 5 把，限定武器伴随限定角色推出
```

---

## 十、关键设计决策

### 9.1 保底继承的处理
同一 `cardPoolType` 类型的所有记录视为**共享保底**（因为 API 返回的就是合并后的该类型全部记录）。按时间从旧到新串联分析即可自动处理继承。

### 9.2 限定角色 vs 常驻角色的判定
- 如果角色名在 `LIMITED_FIVE_STAR_CHARS` 中 → 限定角色
- 如果角色名在 `STANDARD_FIVE_STAR_CHARS` 中 → 常驻角色
- 限定角色池中抽出常驻角色 = **歪卡**
- 设置 `guarantee = true`，下一金必出限定

### 9.3 武器的判定
- 武器池不涉及歪卡（限定武器池 100% UP）
- 但需要维护武器名单来区分"拥有的限定武器"和"拥有的常驻武器"

---

## 十一、开发顺序建议

| 步骤 | 内容 | 说明 |
|------|------|------|
| 1 | 项目脚手架 | `create-tauri-app` (Next.js + Tauri) + shadcn/ui + Tailwind |
| 2 | Tauri 插件集成 | SQL + Store + HTTP 三个插件注册，验证 JS 端可调用 |
| 3 | SQLite 初始化 | 建表 schema、`src/lib/db.ts` 封装读写操作 |
| 4 | Rust 拉取 API | `fetch_gacha_data` Command：遍历 10 种卡池 POST 请求 |
| 5 | 用户参数持久化 | Store 插件存取 playerId 等，首次填写后可记忆 |
| 6 | 数据导入页 | PlayerForm + PoolSelector，首次/失效时填写，否则自动跳过 |
| 7 | 增量写入逻辑 | 实现 `saveRecords()` 的计数比较 + API 原始顺序增量 |
| 8 | 分析引擎 | `gacha-analysis.ts` — 保底/歪卡/统计，基于 sort_order 遍历 |
| 9 | 概览面板 | StatCard 网格 + OwnedList |
| 10 | 卡池分析页 | PoolTabs + FiveStarTable + PityChart (Recharts) + PoolStats |
| 11 | 打磨 | loading/empty/error 状态、首次使用引导 (如何获取 API 参数) |

---

## 十二、注意事项

1. **10 连排序**：游戏 10 连的 10 条记录时间戳完全相同，必须依赖 API 原始顺序 + `sort_order` 列保证正确的时间线
2. **数据量**：最大卡池约 ~400 条记录，SQLite 在前端查询无压力，无需分页
3. **API 返回顺序**：记录按时间倒序（最新在前），增量取前 N 条即最新记录；分析时需要 `ORDER BY sort_order ASC` 获得从旧到新的顺序
4. **联动卡池**：3.4 版本才上线，当前数据为空，UI 需处理空数据状态
5. **新旅/新手池**：数据量少或为空，同样需要空状态处理
6. **参数失效处理**：API 返回 4xx 时提示用户参数已过期，弹出表单重新填写
7. **Store 插件路径**：用户参数保存在 `app_data_dir/params.json`，SQLite 数据库在 `app_data_dir/gacha.db`
