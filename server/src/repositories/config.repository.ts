import type Database from 'better-sqlite3';

export interface ConfigRecord {
  key: string;
  name: string;
  value: string;
  enabled: number;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface SysConfigRecord {
  key: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export class ConfigRepository {
  constructor(private readonly db: Database.Database) {}

  list(): ConfigRecord[] {
    return this.db.prepare('SELECT * FROM config ORDER BY updated_at DESC, key ASC').all() as ConfigRecord[];
  }

  find(key: string): ConfigRecord | null {
    return (this.db.prepare('SELECT * FROM config WHERE key = ?').get(key) as ConfigRecord | undefined) ?? null;
  }

  listSys(): SysConfigRecord[] {
    return this.db.prepare('SELECT * FROM sys_config').all() as SysConfigRecord[];
  }

  set(key: string, name: string, value: string, enabled = true, remark = ''): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO config (key, name, value, enabled, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET name = excluded.name, value = excluded.value,
        enabled = excluded.enabled, remark = excluded.remark, updated_at = excluded.updated_at
    `).run(key, name, value, Number(enabled), remark, now, now);
  }

  create(key: string, name: string, value: string, enabled: boolean, remark: string): ConfigRecord {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO config (key, name, value, enabled, remark, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(key, name, value, Number(enabled), remark, now, now);
    return this.find(key)!;
  }

  update(oldKey: string, key: string, name: string, value: string, enabled: boolean, remark: string): ConfigRecord | null {
    const changed = this.db.prepare(`
      UPDATE config SET key = ?, name = ?, value = ?, enabled = ?, remark = ?, updated_at = ?
      WHERE key = ?
    `).run(key, name, value, Number(enabled), remark, new Date().toISOString(), oldKey);
    return changed.changes ? this.find(key) : null;
  }

  delete(key: string): boolean {
    return this.db.prepare('DELETE FROM config WHERE key = ?').run(key).changes > 0;
  }

  setSys(key: string, name: string, value: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO sys_config (key, name, value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET name = excluded.name, value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, name, value, now, now);
  }

  setSysBatch(entries: Array<{ key: string; name: string; value: string }>): void {
    this.db.transaction(() => {
      for (const entry of entries) this.setSys(entry.key, entry.name, entry.value);
    })();
  }
}
