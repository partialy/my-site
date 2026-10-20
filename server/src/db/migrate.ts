import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

type UpgradeDirectory = 'prod-sql' | 'dev-sql';
type UpgradeFile = { directory: UpgradeDirectory; name: string; sql: string; checksum: string };

const migrationsRoot = path.resolve(__dirname, '../../migrations');

function readSqlFiles(directory: string): { name: string; sql: string }[] {
  const directoryPath = path.join(migrationsRoot, directory);
  return fs.readdirSync(directoryPath)
    .filter((name) => name.toLowerCase().endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(path.join(directoryPath, name), 'utf8') }));
}

function readUpgradeFiles(directory: UpgradeDirectory): UpgradeFile[] {
  return readSqlFiles(directory).map(({ name, sql }) => ({
    directory,
    name,
    sql,
    checksum: createHash('sha256').update(sql).digest('hex'),
  }));
}

function ensureHistoryTables(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS _migration_runs (
    directory TEXT NOT NULL,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('baseline', 'applied')),
    applied_at TEXT NOT NULL,
    PRIMARY KEY (directory, name)
  )`);
}

function initializeDatabase(db: Database.Database, upgrades: UpgradeFile[]): void {
  if (db.prepare('SELECT 1 FROM _migrations LIMIT 1').get()) return;

  const initialFiles = readSqlFiles('sql');
  if (initialFiles.length === 0) throw new Error('未找到数据库初始化 SQL');

  // 全新数据库已经包含最新表结构，当前升级脚本只需记录为基线。
  db.transaction(() => {
    for (const { name, sql } of initialFiles) {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)')
        .run(name, new Date().toISOString());
    }
    for (const file of upgrades) {
      db.prepare(`INSERT INTO _migration_runs (directory, name, checksum, status, applied_at)
        VALUES (?, ?, ?, 'baseline', ?)`).run(file.directory, file.name, file.checksum, new Date().toISOString());
    }
  })();
}

function applyUpgrade(db: Database.Database, file: UpgradeFile): void {
  const previous = db.prepare(`SELECT checksum FROM _migration_runs WHERE directory = ? AND name = ?`)
    .get(file.directory, file.name) as { checksum: string } | undefined;
  if (previous) {
    if (previous.checksum !== file.checksum) {
      throw new Error(`已记录的升级 SQL 内容发生变化：${file.directory}/${file.name}`);
    }
    return;
  }

  // SQL 与执行记录同事务提交，失败时下次启动仍可重试。
  db.transaction(() => {
    db.exec(file.sql);
    db.prepare(`INSERT INTO _migration_runs (directory, name, checksum, status, applied_at)
      VALUES (?, ?, ?, 'applied', ?)`).run(file.directory, file.name, file.checksum, new Date().toISOString());
  })();
}

export function runMigrations(db: Database.Database, includeDevScripts: boolean): void {
  ensureHistoryTables(db);
  const productionUpgrades = readUpgradeFiles('prod-sql');
  const developmentUpgrades = includeDevScripts ? readUpgradeFiles('dev-sql') : [];
  initializeDatabase(db, [...productionUpgrades, ...developmentUpgrades]);
  for (const file of [...productionUpgrades, ...developmentUpgrades]) applyUpgrade(db, file);
}
