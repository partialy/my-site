import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

interface AppliedMigration { name: string; checksum: string }

export function runMigrations(db: Database.Database): void {
  const directory = path.resolve(__dirname, '../../migrations');
  const files = fs.readdirSync(directory).filter((name) => /^\d{4}_[a-z0-9_-]+\.sql$/.test(name)).sort();
  if (files.length === 0) throw new Error('未找到数据库迁移文件');
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`);
  const applied = new Map((db.prepare('SELECT name, checksum FROM _migrations').all() as AppliedMigration[])
    .map((row) => [row.name, row.checksum]));
  for (const name of applied.keys()) {
    if (!files.includes(name)) throw new Error(`已执行的迁移文件不存在：${name}`);
  }
  for (const name of files) {
    const sql = fs.readFileSync(path.join(directory, name), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    if (applied.has(name)) {
      if (applied.get(name) !== checksum) throw new Error(`已执行的迁移文件发生变化：${name}`);
      continue;
    }
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name, checksum, applied_at) VALUES (?, ?, ?)')
        .run(name, checksum, new Date().toISOString());
    })();
  }
}
