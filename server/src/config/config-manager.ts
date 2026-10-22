import { ConfigRepository } from '../repositories/config.repository';

export const SysConfigKey = {
  RequestLogMode: 'request_log_mode',
  RequestLogWhitelist: 'request_log_whitelist',
  ConsoleLogEnabled: 'console_log_enabled',
  ConsoleLogFormat: 'console_log_format',
  ProjectName: 'project_name',
  AdminCopyright: 'admin_copyright',
  AdminSiteTitle: 'admin_site_title',
  AdminSystemName: 'admin_system_name',
  AdminIconMime: 'admin_icon_mime',
  AdminIconVersion: 'admin_icon_version',
  AdminIconFileId: 'admin_icon_file_id',
  AdminLoginAppearance: 'admin_login_appearance',
  ClientSiteTitle: 'client_site_title',
  ClientSystemName: 'client_system_name',
  ClientIconMime: 'client_icon_mime',
  ClientIconVersion: 'client_icon_version',
  ClientIconFileId: 'client_icon_file_id',
  UploadSettings: 'upload_settings',
} as const;

const defaults = [
  [SysConfigKey.RequestLogMode, '日志记录', 'off'],
  [SysConfigKey.RequestLogWhitelist, '日志白名单', []],
  [SysConfigKey.ConsoleLogEnabled, '日志输出', true],
  [SysConfigKey.ConsoleLogFormat, '日志输出格式', '[${time}][${method}] ${url}'],
  [SysConfigKey.ProjectName, '项目名称', 'NodeBase'],
  [SysConfigKey.AdminSiteTitle, '管理后台网站标签名称', 'NodeBase Admin'],
  [SysConfigKey.AdminSystemName, '管理系统名称', 'NodeBase Admin'],
  [SysConfigKey.ClientSiteTitle, '前台网站标签名称', 'NodeBase Client'],
  [SysConfigKey.ClientSystemName, '前台系统名称', 'NodeBase Client'],
] as const;

function decode(value: string): unknown {
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

export class ConfigManager {
  private readonly configs = new Map<string, { value: unknown; enabled: boolean }>();
  private readonly sysConfigs = new Map<string, unknown>();

  constructor(private readonly repository: ConfigRepository) {
    for (const row of repository.list()) {
      this.configs.set(row.key, { value: decode(row.value), enabled: row.enabled === 1 });
    }
    for (const row of repository.listSys()) this.sysConfigs.set(row.key, decode(row.value));
    for (const [key, name, value] of defaults) {
      if (!this.sysConfigs.has(key)) this.setSysConfig(key, name, value);
    }
  }

  getSysConfig(): ReadonlyMap<string, unknown> {
    return this.sysConfigs;
  }

  reloadSysConfigs(): void {
    this.sysConfigs.clear();
    for (const row of this.repository.listSys()) this.sysConfigs.set(row.key, decode(row.value));
  }

  get<T>(key: string, defaultValue: T): T {
    const entry = this.configs.get(key);
    return entry?.enabled ? entry.value as T : defaultValue;
  }

  list() {
    return this.repository.list();
  }

  has(key: string): boolean {
    return this.configs.has(key);
  }

  set<T>(key: string, name: string, value: T, enabled = true, remark = ''): void {
    this.repository.set(key, name, JSON.stringify(value), enabled, remark);
    this.configs.set(key, { value, enabled });
  }

  create(key: string, name: string, value: string, enabled: boolean, remark: string) {
    const row = this.repository.create(key, name, JSON.stringify(value), enabled, remark);
    this.configs.set(key, { value, enabled });
    return row;
  }

  update(oldKey: string, key: string, name: string, value: string, enabled: boolean, remark: string) {
    const row = this.repository.update(oldKey, key, name, JSON.stringify(value), enabled, remark);
    if (row) {
      this.configs.delete(oldKey);
      this.configs.set(key, { value, enabled });
    }
    return row;
  }

  delete(key: string): boolean {
    const deleted = this.repository.delete(key);
    if (deleted) this.configs.delete(key);
    return deleted;
  }

  setSysConfig<T>(key: string, name: string, value: T): void {
    this.repository.setSys(key, name, JSON.stringify(value));
    this.sysConfigs.set(key, value);
  }

  setSysConfigs(entries: Array<{ key: string; name: string; value: unknown }>): void {
    this.repository.setSysBatch(entries.map((entry) => ({
      key: entry.key, name: entry.name, value: JSON.stringify(entry.value),
    })));
    for (const entry of entries) this.sysConfigs.set(entry.key, entry.value);
  }
}
