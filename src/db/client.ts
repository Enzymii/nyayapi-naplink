import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';

import { CONFIG } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { jrrpTable } from './schema.js';

const schema = { jrrpTable };

type AppDb = LibSQLDatabase<typeof schema>;

let drizzleDb: AppDb | null = null;

export const db = (() => {
  const getInstance = () => {
    if (!drizzleDb) {
      throw new Error('数据库尚未初始化，请先调用 initializeDatabase()');
    }

    return drizzleDb;
  };

  return {
    get instance() {
      return getInstance();
    },
  };
})();

export async function initializeDatabase(): Promise<void> {
  if (drizzleDb) {
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), CONFIG.database.path);
  const dataDir = path.dirname(resolvedPath);
  fs.mkdirSync(dataDir, { recursive: true });

  const url = pathToFileURL(resolvedPath).href;
  const libsql = createClient({ url });

  drizzleDb = drizzle(libsql, { schema });

  await drizzleDb.run('PRAGMA journal_mode = WAL');

  await drizzleDb.run(`
    CREATE TABLE IF NOT EXISTS jrrp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adapter_type TEXT NOT NULL,
      adapter_id TEXT NOT NULL,
      group_id TEXT,
      user_id TEXT NOT NULL,
      jrrp INTEGER NOT NULL,
      date TEXT NOT NULL
    )
  `);

  await drizzleDb.run('DROP INDEX IF EXISTS jrrp_identity_by_date_idx');

  await drizzleDb.run(`
    DELETE FROM jrrp
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM jrrp
      GROUP BY adapter_type, adapter_id, user_id, date
    )
  `);

  await drizzleDb.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS jrrp_identity_by_date_idx
      ON jrrp (
        adapter_type,
        adapter_id,
        user_id,
        date
      )
  `);

  logger.info(`SQLite 初始化完成: ${resolvedPath}`);
}
