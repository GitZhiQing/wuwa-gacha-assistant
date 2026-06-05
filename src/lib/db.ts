import type { GachaRecord, GachaRecordRow, SyncMeta } from "./types";
import { isTauri } from "./tauri";

// ============================================================
// 数据库接口（Tauri 环境用 SQLite，浏览器用内存存储）
// ============================================================

interface DbInterface {
  loadRecords(userId: string, poolType: number): Promise<GachaRecordRow[]>;
  getSyncMeta(userId: string, poolType: number): Promise<SyncMeta | null>;
  getAllSyncMeta(userId: string): Promise<SyncMeta[]>;
  getRecordCount(userId: string, poolType: number): Promise<number>;
  saveRecordsIncremental(
    userId: string,
    poolType: number,
    poolName: string,
    apiRecords: GachaRecord[]
  ): Promise<number>;
  clearAllData(userId: string): Promise<void>;
}

// ============================================================
// Tauri SQLite 实现
// ============================================================

async function getTauriDb() {
  const Database = (await import("@tauri-apps/plugin-sql")).default;

  const db = await Database.load("sqlite:gacha.db");

  // 初始化 schema
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gacha_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    NOT NULL,
      pool_type   INTEGER NOT NULL,
      pool_name   TEXT    NOT NULL,
      resource_id INTEGER NOT NULL,
      quality     INTEGER NOT NULL,
      res_type    TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      pull_time   TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      user_id       TEXT    NOT NULL,
      pool_type     INTEGER NOT NULL,
      total_count   INTEGER NOT NULL DEFAULT 0,
      last_sync_at  TEXT    NOT NULL,
      PRIMARY KEY (user_id, pool_type)
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_gacha_pool
    ON gacha_records(user_id, pool_type)
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_gacha_sort
    ON gacha_records(user_id, pool_type, sort_order)
  `);

  return db;
}

// ============================================================
// 浏览器内存实现（仅供开发预览 / 不会持久化）
// ============================================================

class InMemoryDb implements DbInterface {
  private records: Map<string, GachaRecordRow[]> = new Map();
  private meta: Map<string, SyncMeta> = new Map();
  private nextId = 1;

  private key(userId: string, poolType: number): string {
    return `${userId}:${poolType}`;
  }

  async loadRecords(userId: string, poolType: number): Promise<GachaRecordRow[]> {
    return [...(this.records.get(this.key(userId, poolType)) ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  async getSyncMeta(userId: string, poolType: number): Promise<SyncMeta | null> {
    return this.meta.get(this.key(userId, poolType)) ?? null;
  }

  async getAllSyncMeta(): Promise<SyncMeta[]> {
    return [...this.meta.values()];
  }

  async getRecordCount(userId: string, poolType: number): Promise<number> {
    return this.records.get(this.key(userId, poolType))?.length ?? 0;
  }

  async saveRecordsIncremental(
    userId: string,
    poolType: number,
    poolName: string,
    apiRecords: GachaRecord[]
  ): Promise<number> {
    const k = this.key(userId, poolType);
    const existing = this.records.get(k) ?? [];
    const existingCount = existing.length;
    const apiTotal = apiRecords.length;
    const newCount = apiTotal - existingCount;

    if (newCount <= 0) return 0;

    const newRecords = apiRecords.slice(0, newCount);
    let nextSort = existing.length > 0
      ? Math.max(...existing.map((r) => r.sort_order)) + 1
      : 0;

    for (let i = newRecords.length - 1; i >= 0; i--) {
      const r = newRecords[i];
      existing.push({
        id: this.nextId++,
        user_id: userId,
        pool_type: poolType,
        pool_name: poolName,
        resource_id: r.resourceId,
        quality: r.qualityLevel,
        res_type: r.resourceType,
        name: r.name,
        pull_time: r.time,
        sort_order: nextSort++,
        created_at: new Date().toISOString(),
      });
    }

    this.records.set(k, existing);
    this.meta.set(k, {
      user_id: userId,
      pool_type: poolType,
      total_count: apiTotal,
      last_sync_at: new Date().toISOString(),
    });

    return newCount;
  }

  async clearAllData(userId: string): Promise<void> {
    const keys = [...this.records.keys()].filter((k) => k.startsWith(`${userId}:`));
    for (const k of keys) {
      this.records.delete(k);
      this.meta.delete(k);
    }
  }
}

// ============================================================
// 统一 API（根据环境选择实现）
// ============================================================

let dbInstance: DbInterface | null = null;

async function getDbImpl(): Promise<DbInterface> {
  if (dbInstance) return dbInstance;

  if (isTauri()) {
    const sqliteDb = await getTauriDb();
    const impl: DbInterface = {
      async loadRecords(userId, poolType) {
        return sqliteDb.select<GachaRecordRow[]>(
          `SELECT * FROM gacha_records WHERE user_id = $1 AND pool_type = $2 ORDER BY sort_order ASC`,
          [userId, poolType]
        );
      },
      async getSyncMeta(userId, poolType) {
        const rows = await sqliteDb.select<SyncMeta[]>(
          `SELECT * FROM sync_meta WHERE user_id = $1 AND pool_type = $2`,
          [userId, poolType]
        );
        return rows.length > 0 ? rows[0] : null;
      },
      async getAllSyncMeta(userId) {
        return sqliteDb.select<SyncMeta[]>(
          `SELECT * FROM sync_meta WHERE user_id = $1`,
          [userId]
        );
      },
      async getRecordCount(userId, poolType) {
        const rows = await sqliteDb.select<[{ count: number }]>(
          `SELECT COUNT(*) as count FROM gacha_records WHERE user_id = $1 AND pool_type = $2`,
          [userId, poolType]
        );
        return rows[0]?.count ?? 0;
      },
      async saveRecordsIncremental(userId, poolType, poolName, apiRecords) {
        if (apiRecords.length === 0) return 0;
        const existingCount = await this.getRecordCount(userId, poolType);
        const apiTotal = apiRecords.length;
        const newCount = apiTotal - existingCount;
        if (newCount <= 0) return 0;

        const newRecords = apiRecords.slice(0, newCount);
        const maxSortRows = await sqliteDb.select<[{ max_sort: number | null }]>(
          `SELECT MAX(sort_order) as max_sort FROM gacha_records WHERE user_id = $1 AND pool_type = $2`,
          [userId, poolType]
        );
        let nextSort = (maxSortRows[0]?.max_sort ?? -1) + 1;

        for (let i = newRecords.length - 1; i >= 0; i--) {
          const r = newRecords[i];
          await sqliteDb.execute(
            `INSERT INTO gacha_records (user_id, pool_type, pool_name, resource_id, quality, res_type, name, pull_time, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [userId, poolType, poolName, r.resourceId, r.qualityLevel, r.resourceType, r.name, r.time, nextSort]
          );
          nextSort++;
        }

        await sqliteDb.execute(
          `INSERT OR REPLACE INTO sync_meta (user_id, pool_type, total_count, last_sync_at) VALUES ($1, $2, $3, datetime('now'))`,
          [userId, poolType, apiTotal]
        );

        return newCount;
      },
      async clearAllData(userId) {
        await sqliteDb.execute(`DELETE FROM gacha_records WHERE user_id = $1`, [userId]);
        await sqliteDb.execute(`DELETE FROM sync_meta WHERE user_id = $1`, [userId]);
      },
    };
    dbInstance = impl;
  } else {
    console.warn("[DB] Running in browser mode — data will NOT be persisted.");
    dbInstance = new InMemoryDb();
  }

  return dbInstance;
}

// ============================================================
// 导出的公共 API
// ============================================================

export async function loadRecords(
  userId: string,
  poolType: number
): Promise<GachaRecordRow[]> {
  return (await getDbImpl()).loadRecords(userId, poolType);
}

export async function getSyncMeta(
  userId: string,
  poolType: number
): Promise<SyncMeta | null> {
  return (await getDbImpl()).getSyncMeta(userId, poolType);
}

export async function getAllSyncMeta(userId: string): Promise<SyncMeta[]> {
  return (await getDbImpl()).getAllSyncMeta(userId);
}

export async function getRecordCount(
  userId: string,
  poolType: number
): Promise<number> {
  return (await getDbImpl()).getRecordCount(userId, poolType);
}

export async function saveRecordsIncremental(
  userId: string,
  poolType: number,
  poolName: string,
  apiRecords: GachaRecord[]
): Promise<number> {
  return (await getDbImpl()).saveRecordsIncremental(
    userId,
    poolType,
    poolName,
    apiRecords
  );
}

export async function clearAllData(userId: string): Promise<void> {
  return (await getDbImpl()).clearAllData(userId);
}
