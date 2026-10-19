import type Database from 'better-sqlite3';

export interface MenuRecord {
  key: string;
  label: string;
  type: 'group' | 'route' | 'action';
  parentKey: string | null;
  path: string | null;
  action: string | null;
  icon: string | null;
  sort: number;
  visible: boolean;
}

interface MenuRow {
  key: string;
  label: string;
  type: MenuRecord['type'];
  parent_key: string | null;
  path: string | null;
  action: string | null;
  icon: string | null;
  sort: number;
  visible: number;
}

const defaultMenus: MenuRecord[] = [
  { key: 'home', label: '首页', type: 'route', parentKey: null, path: '/', action: null, icon: 'layout-dashboard', sort: 0, visible: true },
  { key: 'system-settings', label: '系统设置', type: 'group', parentKey: null, path: null, action: null, icon: 'settings', sort: 1, visible: true },
  { key: 'system-config', label: '系统管理', type: 'route', parentKey: 'system-settings', path: '/system-config', action: null, icon: 'setting', sort: 0, visible: true },
  { key: 'configs', label: '配置管理', type: 'route', parentKey: 'system-settings', path: '/configs', action: null, icon: 'database', sort: 1, visible: true },
  { key: 'request-logs', label: '请求日志', type: 'route', parentKey: 'system-settings', path: '/request-logs', action: null, icon: 'file-text', sort: 2, visible: true },
  { key: 'files', label: '文件管理', type: 'route', parentKey: 'system-settings', path: '/files', action: null, icon: 'folder', sort: 3, visible: true },
  { key: 'menu-management', label: '菜单管理', type: 'route', parentKey: 'system-settings', path: '/menus', action: null, icon: 'menu', sort: 4, visible: true },
];

const initializedKey = 'menu_initialized';
const passwordMenuRemovedKey = 'menu_password_removed';

function mapRow(row: MenuRow): MenuRecord {
  return {
    key: row.key,
    label: row.label,
    type: row.type,
    parentKey: row.parent_key,
    path: row.path,
    action: row.action,
    icon: row.icon,
    sort: row.sort,
    visible: row.visible === 1,
  };
}

export class MenuRepository {
  constructor(private readonly db: Database.Database) {
    this.initialize();
    this.removeDefaultPasswordMenu();
  }

  private insert(items: MenuRecord[]): void {
    const statement = this.db.prepare(`
      INSERT INTO menu (key, label, type, parent_key, path, action, icon, sort, visible)
      VALUES (@key, @label, @type, @parentKey, @path, @action, @icon, @sort, @visible)
    `);
    for (const item of items) statement.run({ ...item, visible: item.visible ? 1 : 0 });
  }

  private initialize(): void {
    this.db.transaction(() => {
      const marker = this.db.prepare('SELECT 1 FROM sys_config WHERE key = ?').get(initializedKey);
      if (marker) return;
      const count = this.db.prepare('SELECT COUNT(*) AS count FROM menu').get() as { count: number };
      if (count.count === 0) this.insert(defaultMenus);
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO sys_config (key, name, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(initializedKey, '菜单初始化标记', 'true', now, now);
    })();
  }

  private removeDefaultPasswordMenu(): void {
    this.db.transaction(() => {
      const marker = this.db.prepare('SELECT 1 FROM sys_config WHERE key = ?').get(passwordMenuRemovedKey);
      if (marker) return;
      this.db.prepare("DELETE FROM menu WHERE key = 'change-password' AND type = 'action' AND action = 'change-password'").run();
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO sys_config (key, name, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(passwordMenuRemovedKey, '默认修改密码菜单移除标记', 'true', now, now);
    })();
  }

  list(): MenuRecord[] {
    const rows = this.db.prepare(`
      SELECT key, label, type, parent_key, path, action, icon, sort, visible
      FROM menu ORDER BY CASE WHEN parent_key IS NULL THEN 0 ELSE 1 END, parent_key, sort, key
    `).all() as MenuRow[];
    return rows.map(mapRow);
  }

  replace(items: MenuRecord[]): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM menu').run();
      this.insert(items);
    })();
  }
}
