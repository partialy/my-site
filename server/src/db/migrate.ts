import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  const directory = path.resolve(__dirname, '../../migrations');
  const files = fs.readdirSync(directory).filter((name) => /^\d{4}_[a-z0-9_-]+\.sql$/.test(name)).sort();
  if (files.length === 0) throw new Error('未找到数据库初始化 SQL');
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  // 开发期只在新库执行初始化 SQL；旧开发库的结构变化由开发者单独执行升级 SQL。
  if (db.prepare('SELECT 1 FROM _migrations LIMIT 1').get()) return;
  db.transaction(() => {
    for (const name of files) {
      const sql = fs.readFileSync(path.join(directory, name), 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)')
        .run(name, new Date().toISOString());
    }
  })();
}
