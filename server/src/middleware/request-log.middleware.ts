import type { RequestHandler } from 'express';
import type Database from 'better-sqlite3';
import { SystemConfigService, type WhitelistRule } from '../services/system-config.service';

const secretKey = /password|passwd|secret|token|authorization|setupkey|cookie|api.?key|visitorid/i;
const maxLength = 16_384;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[层级过深]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, secretKey.test(key) ? '[已脱敏]' : redact(item, depth + 1),
    ]));
  }
  return value;
}

function serialize(value: unknown): string {
  let json: string;
  try { json = JSON.stringify(redact(value)) ?? 'null'; } catch { json = '"[无法序列化]"'; }
  return json.length > maxLength ? `${json.slice(0, maxLength)}...[已截断]` : json;
}

function safeUrl(originalUrl: string, absolute = false): string {
  try {
    const url = new URL(originalUrl, 'http://localhost');
    for (const key of url.searchParams.keys()) {
      if (secretKey.test(key)) url.searchParams.set(key, '[已脱敏]');
    }
    return (absolute ? url.origin : '') + url.pathname + url.search;
  } catch {
    return '[无效 URL]';
  }
}

function matches(path: string, rule: WhitelistRule): boolean {
  if (rule.type === 'exact') return path === rule.path;
  const prefix = rule.path.slice(0, -3);
  return path === prefix || path.startsWith(`${prefix}/`);
}

function localTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatLine(format: string, values: Record<string, string>): string {
  return format.replace(/\$\{(time|method|url|status|duration|ip)\}/g, (_, key: string) => values[key] ?? '');
}

export function requestLogMiddleware(config: SystemConfigService, db: Database.Database): RequestHandler {
  const insert = () => db.prepare(`
    INSERT INTO request_log (time, method, path, url, request_data, response_data,
      status, duration_ms, ip, origin, referer, user_agent)
    VALUES (@time, @method, @path, @url, @requestData, @responseData,
      @status, @duration, @ip, @origin, @referer, @userAgent)
  `);

  return (req, res, next) => {
    const started = Date.now();
    let responseBody: unknown = null;
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      responseBody = body;
      return originalJson(body);
    }) as typeof res.json;

    res.once('finish', () => {
      const settings = config.get();
      const path = req.originalUrl.split('?')[0] ?? req.path;
      const url = safeUrl(req.originalUrl);
      const time = new Date();
      const duration = Date.now() - started;
      const values = {
        time: localTime(time), method: req.method, url,
        status: String(res.statusCode), duration: `${duration}ms`, ip: req.ip ?? '',
      };

      if (settings.consoleLogEnabled) console.log(formatLine(settings.consoleLogFormat, values));
      if (path === '/api/v1/admin/request-logs' || path === '/api/v1/admin/operation-logs' ||
        path === '/api/v1/admin/home' || path === '/api/v1/admin/system-status' ||
        path === '/api/v1/admin/backups/database' ||
        /^\/api\/v1\/request-logs?\/?$/.test(path)) return;
      if (settings.requestLogMode === 'off') return;
      if (settings.requestLogMode === 'white_list' && !settings.requestLogWhitelist.some((rule) => matches(path, rule))) return;

      try {
        const hidesConfigValues = path === '/api/v1/admin/configs' || path.startsWith('/api/v1/admin/configs/') ||
          path === '/api/v1/admin/site-settings' || path.startsWith('/api/v1/admin/site-settings/') ||
          path === '/api/v1/site-settings' || path.startsWith('/api/v1/site-settings/') ||
          path === '/api/v1/admin/upload-settings' ||
          path.startsWith('/api/v1/admin/payment-settings/') ||
          path === '/api/v1/uploads/prepare';
        insert().run({
          time: time.toISOString(), method: req.method, path, url,
          requestData: hidesConfigValues ? '"[配置内容已隐藏]"' : serialize({
            query: req.query, body: Buffer.isBuffer(req.body) ? '[二进制内容已省略]' : req.body,
          }),
          responseData: hidesConfigValues ? '"[配置内容已隐藏]"' : serialize(responseBody),
          status: res.statusCode, duration,
          ip: req.ip ?? null, origin: req.get('origin') ?? null,
          referer: req.get('referer') ? safeUrl(req.get('referer')!, true) : null,
          userAgent: req.get('user-agent') ?? null,
        });
      } catch (error) {
        console.error('请求日志写入失败', error);
      }
    });
    next();
  };
}
