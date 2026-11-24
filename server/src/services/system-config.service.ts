import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';

export const logModeSchema = z.enum(['all', 'white_list', 'off']);
const pathSchema = z.string().min(1).max(500).startsWith('/api/v1/').refine((path) => !/[?#\s]/.test(path));
export const whitelistInputSchema = z.strictObject({
  name: z.string().trim().max(80).optional(),
  type: z.enum(['wildcard', 'exact']),
  path: pathSchema,
  remark: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'wildcard' && (!value.path.endsWith('/**') || value.path.slice(0, -3).includes('*'))) {
    ctx.addIssue({ code: 'custom', path: ['path'], message: '通配路径必须以 /** 结尾，且不能包含其他通配符' });
  }
  if (value.type === 'exact' && value.path.includes('*')) {
    ctx.addIssue({ code: 'custom', path: ['path'], message: '精准路径不能包含通配符' });
  }
});
export const systemConfigInputSchema = z.strictObject({
  requestLogMode: logModeSchema,
  consoleLogEnabled: z.boolean(),
  consoleLogFormat: z.string().min(1).max(500),
});

export interface WhitelistRule {
  id: string;
  name: string;
  type: 'wildcard' | 'exact';
  path: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigData {
  requestLogMode: z.infer<typeof logModeSchema>;
  requestLogWhitelist: WhitelistRule[];
  consoleLogEnabled: boolean;
  consoleLogFormat: string;
}

export class SystemConfigService {
  constructor(private readonly manager: ConfigManager, private readonly db: Database.Database) {
    this.syncAfterImport();
  }

  syncAfterImport(): void {
    if (this.get().requestLogMode !== 'off') this.ensureLogTable();
  }

  get(): SystemConfigData {
    const config = this.manager.getSysConfig();
    return {
      requestLogMode: logModeSchema.parse(config.get(SysConfigKey.RequestLogMode)),
      requestLogWhitelist: this.getWhitelist(),
      consoleLogEnabled: z.boolean().parse(config.get(SysConfigKey.ConsoleLogEnabled)),
      consoleLogFormat: z.string().parse(config.get(SysConfigKey.ConsoleLogFormat)),
    };
  }

  update(input: z.infer<typeof systemConfigInputSchema>): SystemConfigData {
    if (input.requestLogMode !== 'off') this.ensureLogTable();
    this.manager.setSysConfigs([
      { key: SysConfigKey.RequestLogMode, name: '日志记录', value: input.requestLogMode },
      { key: SysConfigKey.ConsoleLogEnabled, name: '日志输出', value: input.consoleLogEnabled },
      { key: SysConfigKey.ConsoleLogFormat, name: '日志输出格式', value: input.consoleLogFormat },
    ]);
    return this.get();
  }

  getWhitelist(): WhitelistRule[] {
    return z.array(z.object({
      id: z.string(), name: z.string(), type: z.enum(['wildcard', 'exact']),
      path: z.string(), remark: z.string(), createdAt: z.string(), updatedAt: z.string(),
    })).parse(this.manager.getSysConfig().get(SysConfigKey.RequestLogWhitelist));
  }

  createRule(input: z.infer<typeof whitelistInputSchema>): WhitelistRule {
    const rules = this.getWhitelist();
    let id: string;
    do { id = randomUUID().replaceAll('-', '').slice(0, 8); } while (rules.some((rule) => rule.id === id));
    const now = new Date().toISOString();
    const rule: WhitelistRule = {
      id, name: input.name || id, type: input.type, path: input.path,
      remark: input.remark || '', createdAt: now, updatedAt: now,
    };
    this.saveWhitelist([...rules, rule]);
    return rule;
  }

  updateRule(id: string, input: z.infer<typeof whitelistInputSchema>): WhitelistRule {
    const rules = this.getWhitelist();
    const index = rules.findIndex((rule) => rule.id === id);
    if (index < 0) throw new ApiError(404, ApiCode.NotFound, '白名单规则不存在');
    const current = rules[index]!;
    const updated = {
      ...current, name: input.name || current.name, type: input.type,
      path: input.path, remark: input.remark || '', updatedAt: new Date().toISOString(),
    };
    rules[index] = updated;
    this.saveWhitelist(rules);
    return updated;
  }

  deleteRule(id: string): void {
    const rules = this.getWhitelist();
    const remaining = rules.filter((rule) => rule.id !== id);
    if (remaining.length === rules.length) throw new ApiError(404, ApiCode.NotFound, '白名单规则不存在');
    this.saveWhitelist(remaining);
  }

  private saveWhitelist(rules: WhitelistRule[]): void {
    this.manager.setSysConfig(SysConfigKey.RequestLogWhitelist, '日志白名单', rules);
  }

  private ensureLogTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS request_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        time TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        url TEXT NOT NULL,
        request_data TEXT,
        response_data TEXT,
        status INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        ip TEXT,
        origin TEXT,
        referer TEXT,
        user_agent TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_request_log_time ON request_log(time);
    `);
  }
}
