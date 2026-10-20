import type Database from 'better-sqlite3';
import { SysConfigKey } from '../config/config-manager';
import type { SetupAdminRequest } from '../api/schemas';
import type { AdminSummary } from '../api/types';

export class SetupRepository {
  constructor(private readonly db: Database.Database) {}

  create(input: SetupAdminRequest, passwordHash: string): AdminSummary | null {
    return this.db.transaction(() => {
      if (this.db.prepare('SELECT 1 FROM admin WHERE id = 1').get()) return null;
      const now = new Date().toISOString();
      const result = this.db.prepare(`
        INSERT INTO admin (id, username, password_hash, token_version, created_at, updated_at)
        VALUES (1, ?, ?, 0, ?, ?)
      `).run(input.username, passwordHash, now, now);
      const entries = [
        [SysConfigKey.ProjectName, '项目名称', input.projectName],
        [SysConfigKey.AdminSiteTitle, '管理后台网站标签名称', input.siteSettings.admin.siteTitle],
        [SysConfigKey.AdminSystemName, '管理系统名称', input.siteSettings.admin.systemName],
        [SysConfigKey.ClientSiteTitle, '前台网站标签名称', input.siteSettings.client.siteTitle],
        [SysConfigKey.ClientSystemName, '前台系统名称', input.siteSettings.client.systemName],
      ];
      const writeConfig = this.db.prepare(`
        INSERT INTO sys_config (key, name, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET name = excluded.name, value = excluded.value, updated_at = excluded.updated_at
      `);
      for (const [key, name, value] of entries) writeConfig.run(key, name, JSON.stringify(value), now, now);
      return { id: Number(result.lastInsertRowid), username: input.username };
    }).immediate();
  }
}
