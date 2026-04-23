import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { CONFIG } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { jrrpTable } from './schema.js';

let sqlite: Database.Database | null = null;

export const db = (() => {
  const getInstance = () => {
    if (!sqlite) {
      throw new Error('数据库尚未初始化，请先调用 initializeDatabase()');
    }

    return drizzle(sqlite, { schema: { jrrpTable } });
  };

  return {
    get instance() {
      return getInstance();
    },
  };
})();

export function initializeDatabase(): void {
  if (sqlite) {
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), CONFIG.database.path);
  const dataDir = path.dirname(resolvedPath);
  fs.mkdirSync(dataDir, { recursive: true });

  sqlite = new Database(resolvedPath);
  sqlite.pragma('journal_mode = WAL');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jrrp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adapter_type TEXT NOT NULL,
      adapter_id TEXT NOT NULL,
      group_id TEXT,
      user_id TEXT NOT NULL,
      jrrp INTEGER NOT NULL,
      date TEXT NOT NULL
    );

    DROP INDEX IF EXISTS jrrp_identity_by_date_idx;

    DELETE FROM jrrp
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM jrrp
      GROUP BY adapter_type, adapter_id, user_id, date
    );

    CREATE UNIQUE INDEX IF NOT EXISTS jrrp_identity_by_date_idx
      ON jrrp (
        adapter_type,
        adapter_id,
        user_id,
        date
      );
  `);

  logger.info(`SQLite 初始化完成: ${resolvedPath}`);
}
