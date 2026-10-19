import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export function openDatabase(filePath: string): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath, { timeout: 5000 });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      remark TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sys_config (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS file (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      archived_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_file_active_created ON file(archived_at, created_at DESC);
  `);
  // 兼容早期只有 key、value、updated_at 的 config 表，保留已有记录。
  const columns = new Set((db.pragma('table_info(config)') as Array<{ name: string }>).map((item) => item.name));
  if (!columns.has('name')) db.exec("ALTER TABLE config ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  if (!columns.has('enabled')) db.exec('ALTER TABLE config ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1');
  if (!columns.has('remark')) db.exec("ALTER TABLE config ADD COLUMN remark TEXT NOT NULL DEFAULT ''");
  if (!columns.has('created_at')) {
    db.exec("ALTER TABLE config ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
    db.exec("UPDATE config SET created_at = updated_at WHERE created_at = ''");
  }
  return db;
}
