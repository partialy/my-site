import { API_GROUPS } from './apiCatalog';
import type { ApiEndpoint } from './apiCatalog';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface EndpointExample {
  request?: JsonValue;
  requestKind?: 'JSON Body' | 'Query' | 'Path' | '原始文件';
  response?: JsonValue;
}

const success = (data: JsonValue, msg = '成功'): JsonValue => ({ code: 0, msg, data, success: true });
const admin = '/api/v1/admin';
const publicApi = '/api/v1';
const adminInfo = { id: 1, username: 'admin' };
const rule = { id: 'a1b2c3d4', name: '用户接口', type: 'wildcard', path: '/api/v1/user/**',
  remark: '记录用户模块', createdAt: '2026-10-20T08:00:00.000Z', updatedAt: '2026-10-20T08:00:00.000Z' };
const config = { key: 'contact.email', name: '联系邮箱', value: 'hello@example.com', enabled: true,
  remark: '站点联系方式', createdAt: '2026-10-20T08:00:00.000Z', updatedAt: '2026-10-20T08:00:00.000Z' };
const menu = { key: 'home', label: '首页', type: 'route', parentKey: null, path: '/', action: null,
  icon: 'layout-dashboard', sort: 1, visible: true };
const site = { projectName: '示例项目', admin: { siteTitle: '管理后台', systemName: '管理系统', iconUrl: null },
  client: { siteTitle: '网站首页', systemName: '前台系统', iconUrl: null } };
const file = { id: '7a9e4c72-b061-4ee6-9ed8-d986dbd6c919', name: 'logo.png', mimeType: 'image/png',
  size: 12345, url: '/api/v1/files/7a9e4c72-b061-4ee6-9ed8-d986dbd6c919/content',
  createdAt: '2026-10-20T08:00:00.000Z' };
const log = { id: 1, time: '2026-10-20T08:00:00.000Z', method: 'GET', path: '/api/v1/site-settings',
  url: '/api/v1/site-settings', requestData: null, responseData: '{"code":0}', status: 200,
  durationMs: 12, ip: '127.0.0.1', origin: null, referer: null, userAgent: 'Mozilla/5.0' };
const visit = { id: 1, day: '2026-10-20', visitorId: '7a9e4c72-b061-4ee6-9ed8-d986dbd6c919',
  path: '/', pageTitle: '首页', referrer: '', ip: '127.0.0.1', userAgent: 'Mozilla/5.0',
  createdAt: '2026-10-20T08:00:00.000Z' };
const home = {
  visits: { today: 18, yesterday: 15, last7Days: 102, trend7: [{ day: '2026-10-20', visits: 18 }],
    trend30: [{ day: '2026-10-20', visits: 18 }] },
  users: { source: 'mock', total: 2680, activeLast7Days: 468, newLast7Days: 302,
    trend7: [{ day: '2026-10-20', newUsers: 63, activeUsers: 172 }] },
  requestLogs: { total: 24, successRate: 95.8, sources: [{ name: 'example.com', count: 10 }],
    topPaths: [{ path: '/api/v1/site-settings', count: 8 }] },
};

const examples: Record<string, EndpointExample> = {
  [`GET ${admin}/setup/status`]: { response: success({ initialized: false }) },
  [`POST ${admin}/setup/admin`]: { request: { username: 'admin', password: '<至少12位密码>', setupKey: '<初始化密钥>',
    projectName: '示例项目', siteSettings: {
      admin: { siteTitle: '示例项目后台', systemName: '示例项目管理系统' },
      client: { siteTitle: '示例项目', systemName: '示例项目' },
    } },
    response: success(adminInfo, '管理员初始化成功') },
  [`POST ${admin}/auth/login`]: { request: { username: 'admin', password: '<管理员密码>' },
    response: success({ token: '<JWT>', tokenType: 'Bearer', expiresIn: 43200, admin: adminInfo }, '登录成功') },
  [`GET ${admin}/auth/me`]: { response: success(adminInfo) },
  [`PUT ${admin}/auth/password`]: { request: { oldPassword: '<原密码>', newPassword: '<新密码>' },
    response: success(null, '密码修改成功，请重新登录') },
  [`GET ${admin}/system-config`]: { response: success({ requestLogMode: 'off', requestLogWhitelist: [],
    consoleLogEnabled: true, consoleLogFormat: '[${time}][${method}] ${url}' }) },
  [`PUT ${admin}/system-config`]: { request: { requestLogMode: 'white_list', consoleLogEnabled: true,
    consoleLogFormat: '[${time}][${method}] ${url}' }, response: success({ requestLogMode: 'white_list',
    requestLogWhitelist: [rule], consoleLogEnabled: true, consoleLogFormat: '[${time}][${method}] ${url}' }, '系统配置已保存') },
  [`GET ${admin}/system-config/whitelist`]: { response: success([rule]) },
  [`POST ${admin}/system-config/whitelist`]: { request: { name: '用户接口', type: 'wildcard', path: '/api/v1/user/**', remark: '记录用户模块' },
    response: success(rule, '白名单规则已创建') },
  [`PUT ${admin}/system-config/whitelist/:id`]: { requestKind: 'JSON Body',
    request: { name: '用户接口', type: 'wildcard', path: '/api/v1/user/**', remark: '记录用户模块' },
    response: success(rule, '白名单规则已更新') },
  [`DELETE ${admin}/system-config/whitelist/:id`]: { requestKind: 'Path', request: { id: 'a1b2c3d4' },
    response: success(null, '白名单规则已删除') },
  [`GET ${admin}/configs`]: { response: success([config]) },
  [`POST ${admin}/configs`]: { request: { key: 'contact.email', name: '联系邮箱', value: 'hello@example.com',
    enabled: true, remark: '站点联系方式' }, response: success(config, '配置已创建') },
  [`PUT ${admin}/configs/:key`]: { request: { key: 'contact.email', name: '联系邮箱', value: 'hello@example.com',
    enabled: true, remark: '站点联系方式' }, response: success(config, '配置已更新') },
  [`DELETE ${admin}/configs/:key`]: { requestKind: 'Path', request: { key: 'contact.email' },
    response: success(null, '配置已删除') },
  [`GET ${admin}/menus`]: { response: success([menu]) },
  [`PUT ${admin}/menus`]: { request: { items: [menu] }, response: success([menu], '菜单已保存') },
  [`GET ${admin}/site-settings`]: { response: success(site) },
  [`PUT ${admin}/site-settings`]: { request: { projectName: '示例项目', admin: { siteTitle: '管理后台', systemName: '管理系统' },
    client: { siteTitle: '网站首页', systemName: '前台系统' } }, response: success(site, '站点配置已保存') },
  [`PUT ${admin}/site-settings/:target/icon`]: { requestKind: '原始文件', request: { target: 'admin',
    contentType: 'image/png', body: '<图片二进制，最大 2 MiB>' }, response: success(site, '图标已上传') },
  [`PUT ${admin}/site-settings/:target/icon-file`]: { request: { fileId: file.id },
    response: success({ ...site, admin: { ...site.admin, iconUrl: file.url } }, '图标已设置') },
  [`DELETE ${admin}/site-settings/:target/icon`]: { requestKind: 'Path', request: { target: 'admin' },
    response: success(site, '图标已删除') },
  [`GET ${admin}/request-logs`]: { requestKind: 'Query', request: { page: 1, pageSize: 20,
    method: 'GET', path: '/api/v1/site-settings', status: 200 },
    response: success({ items: [log], total: 1, page: 1, pageSize: 20 }) },
  [`DELETE ${admin}/request-logs`]: { request: { mode: 'keepLatest', count: 100 },
    response: success({ deleted: 12 }, '请求日志已清理') },
  [`GET ${admin}/home`]: { response: success(home) },
  [`GET ${admin}/visits`]: { requestKind: 'Query', request: { page: 1, pageSize: 20,
    path: '/', visitorId: visit.visitorId, startDay: '2026-10-01', endDay: '2026-10-20' },
    response: success({ items: [visit], total: 1, page: 1, pageSize: 20 }) },
  [`GET ${admin}/files`]: { requestKind: 'Query', request: { page: 1, pageSize: 20, search: 'logo', mimeTypes: 'image/png,image/jpeg' },
    response: success({ items: [file], total: 1, page: 1, pageSize: 20 }) },
  [`POST ${admin}/files`]: { requestKind: '原始文件', request: { contentType: 'image/png',
    xFileName: 'logo.png', body: '<文件二进制，最大 10 MiB>' }, response: success(file, '文件已上传') },
  [`DELETE ${admin}/files/:id`]: { requestKind: 'Path', request: { id: file.id },
    response: success(null, '文件已归档') },
  [`GET ${publicApi}/site-settings`]: { response: success(site) },
  [`GET ${publicApi}/site-settings/:target/icon`]: { requestKind: 'Path', request: { target: 'admin' } },
  [`GET ${publicApi}/files/:id/content`]: { requestKind: 'Path', request: { id: file.id } },
  [`POST ${publicApi}/visits`]: { request: { visitorId: visit.visitorId, path: '/', pageTitle: '首页',
    referrer: 'https://example.com/' }, response: success({ recorded: true, day: '2026-10-20' }) },
};

export function getEndpointExample(endpoint: ApiEndpoint): EndpointExample {
  const key = `${endpoint.method} ${endpoint.path}`;
  const example = examples[key];
  if (!example) throw new Error(`缺少接口示例：${key}`);
  return example;
}

// 开发时立即检查目录与示例的覆盖关系，避免新增接口后页面只显示旧的伪类型描述。
for (const group of API_GROUPS) for (const endpoint of group.endpoints) getEndpointExample(endpoint);
