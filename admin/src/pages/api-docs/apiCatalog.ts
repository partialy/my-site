export type ApiAudience = 'admin' | 'public';
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiEndpoint {
  method: ApiMethod;
  path: string;
  title: string;
  auth: boolean;
  request?: string;
  response: string;
  note?: string;
  binary?: boolean;
}

export interface ApiGroup {
  audience: ApiAudience;
  module: string;
  endpoints: ApiEndpoint[];
}

const admin = '/api/v1/admin';
const publicApi = '/api/v1';
const adminInfo = '{ id: number; username: string }';
const siteSettings = '{ admin: { siteTitle: string; systemName: string; iconUrl: string | null }; client: 同 admin }';
const configItem = '{ key: string; name: string; value: string; enabled: boolean; remark: string; createdAt: ISO时间; updatedAt: ISO时间 }';
const whitelistRule = '{ id: string; name: string; type: "wildcard" | "exact"; path: string; remark: string; createdAt: ISO时间; updatedAt: ISO时间 }';
const fileItem = '{ id: UUID; name: string; mimeType: string; size: number; url: string; createdAt: ISO时间 }';
const menuItem = '{ key: string; label: string; type: "group" | "route" | "action"; parentKey: string | null; path: string | null; action: string | null; icon: string | null; sort: number; visible: boolean }';

export const API_GROUPS: readonly ApiGroup[] = [
  { audience: 'admin', module: '初始化与认证', endpoints: [
    { method: 'GET', path: `${admin}/setup/status`, title: '查询初始化状态', auth: false,
      response: '{ initialized: boolean }' },
    { method: 'POST', path: `${admin}/setup/admin`, title: '创建初始管理员', auth: false,
      request: 'JSON: { username: string(3-32, 字母/数字/下划线); password: string(12-128); setupKey: string }',
      response: adminInfo, note: '仅首次初始化可用；成功时 HTTP 201。' },
    { method: 'POST', path: `${admin}/auth/login`, title: '管理员登录', auth: false,
      request: 'JSON: { username: string; password: string }',
      response: `{ token: string; tokenType: "Bearer"; expiresIn: number(秒); admin: ${adminInfo} }` },
    { method: 'GET', path: `${admin}/auth/me`, title: '当前管理员', auth: true, response: adminInfo },
    { method: 'PUT', path: `${admin}/auth/password`, title: '修改密码', auth: true,
      request: 'JSON: { oldPassword: string; newPassword: string(12-128) }',
      response: 'null', note: '修改后当前 JWT 失效，需重新登录。' },
  ] },
  { audience: 'admin', module: '系统管理', endpoints: [
    { method: 'GET', path: `${admin}/system-config`, title: '获取日志配置', auth: true,
      response: `{ requestLogMode: "off" | "all" | "white_list"; requestLogWhitelist: ${whitelistRule}[]; consoleLogEnabled: boolean; consoleLogFormat: string }` },
    { method: 'PUT', path: `${admin}/system-config`, title: '保存日志配置', auth: true,
      request: 'JSON: { requestLogMode: "off" | "all" | "white_list"; consoleLogEnabled: boolean; consoleLogFormat: string(1-500) }',
      response: '同「获取日志配置」' },
    { method: 'GET', path: `${admin}/system-config/whitelist`, title: '获取请求日志白名单', auth: true,
      response: `${whitelistRule}[]` },
    { method: 'POST', path: `${admin}/system-config/whitelist`, title: '新增白名单规则', auth: true,
      request: 'JSON: { name?: string; type: "wildcard" | "exact"; path: string; remark?: string }',
      response: whitelistRule, note: '路径以 /api/v1/ 开头；通配类型必须以 /** 结尾。成功时 HTTP 201。' },
    { method: 'PUT', path: `${admin}/system-config/whitelist/:id`, title: '修改白名单规则', auth: true,
      request: '路径: id=规则 ID；JSON: { name?: string; type: "wildcard" | "exact"; path: string; remark?: string }',
      response: whitelistRule },
    { method: 'DELETE', path: `${admin}/system-config/whitelist/:id`, title: '删除白名单规则', auth: true,
      request: '路径: id=规则 ID', response: 'null' },
  ] },
  { audience: 'admin', module: '配置管理', endpoints: [
    { method: 'GET', path: `${admin}/configs`, title: '获取动态配置', auth: true, response: `${configItem}[]` },
    { method: 'POST', path: `${admin}/configs`, title: '新增动态配置', auth: true,
      request: 'JSON: { key: string; name: string; value: string; enabled: boolean; remark: string }',
      response: configItem, note: 'key 以字母开头；成功时 HTTP 201。' },
    { method: 'PUT', path: `${admin}/configs/:key`, title: '修改动态配置', auth: true,
      request: '路径: key=原配置键，需 URL 编码；JSON: { key: string; name: string; value: string; enabled: boolean; remark: string }',
      response: configItem, note: '请求体中的 key 可以是新键。' },
    { method: 'DELETE', path: `${admin}/configs/:key`, title: '删除动态配置', auth: true,
      request: '路径: key=配置键，需 URL 编码', response: 'null' },
  ] },
  { audience: 'admin', module: '菜单管理', endpoints: [
    { method: 'GET', path: `${admin}/menus`, title: '获取菜单', auth: true, response: `${menuItem}[]` },
    { method: 'PUT', path: `${admin}/menus`, title: '整体保存菜单', auth: true,
      request: `JSON: { items: ${menuItem}[] }，最多 200 项`, response: `${menuItem}[]`,
      note: '整体替换并刷新服务端内存；分组仅允许一级，页面路径不可重复。旧 action 菜单仅供兼容。' },
  ] },
  { audience: 'admin', module: '站点设置', endpoints: [
    { method: 'GET', path: `${admin}/site-settings`, title: '获取后台与前台站点设置', auth: false,
      response: siteSettings },
    { method: 'PUT', path: `${admin}/site-settings`, title: '保存站点名称', auth: true,
      request: 'JSON: { admin: { siteTitle: string; systemName: string }; client: { siteTitle: string; systemName: string } }',
      response: siteSettings },
    { method: 'PUT', path: `${admin}/site-settings/:target/icon`, title: '直接上传站点图标', auth: true,
      request: '路径: target=admin | client；Body: 原始图片字节；Content-Type: image/png | image/jpeg | image/webp | image/x-icon',
      response: siteSettings, note: '最大 2 MiB。' },
    { method: 'PUT', path: `${admin}/site-settings/:target/icon-file`, title: '选择文件库图标', auth: true,
      request: '路径: target=admin | client；JSON: { fileId: UUID }',
      response: siteSettings, note: '所选文件须为支持的图片格式且不超过 2 MiB。' },
    { method: 'DELETE', path: `${admin}/site-settings/:target/icon`, title: '移除站点图标', auth: true,
      request: '路径: target=admin | client', response: siteSettings },
  ] },
  { audience: 'admin', module: '请求日志', endpoints: [
    { method: 'GET', path: `${admin}/request-logs`, title: '分页查询请求日志', auth: true,
      request: 'Query: page=1；pageSize=20(1-100)；method?；path?；status?(100-599)',
      response: '{ items: RequestLogItem[]; total: number; page: number; pageSize: number }',
      note: 'RequestLogItem: id、time、method、path、url、requestData、responseData、status、durationMs、ip、origin、referer、userAgent。未开启日志时可返回空列表。' },
    { method: 'DELETE', path: `${admin}/request-logs`, title: '清理请求日志', auth: true,
      request: 'JSON 五选一: { mode: "ids"; ids: number[](1-500) } | { mode: "timeRange"; startTime: ISO时间; endTime: ISO时间 } | { mode: "beforeTime" | "afterTime"; time: ISO时间 } | { mode: "keepLatest"; count: number }',
      response: '{ deleted: number }', note: '时间段包含起止边界；时间前/后为严格比较；最新按日志 ID 判定。' },
  ] },
  { audience: 'admin', module: '首页统计', endpoints: [
    { method: 'GET', path: `${admin}/home`, title: '获取首页数据', auth: true,
      response: '{ visits: { today: number; yesterday: number; last7Days: number; trend7: { day: string; visits: number }[]; trend30: 同 trend7 }; users: { source: "mock"; total: number; activeLast7Days: number; newLast7Days: number; trend7: { day: string; newUsers: number; activeUsers: number }[] }; requestLogs: { total: number; successRate: number | null; sources: { name: string; count: number }[]; topPaths: { path: string; count: number }[] } }',
      note: '访问和已记录的接口日志是真实数据；用户相关数据目前为模拟。' },
  ] },
  { audience: 'admin', module: '访问日志', endpoints: [
    { method: 'GET', path: `${admin}/visits`, title: '分页查询访问日志', auth: true,
      request: 'Query: page=1；pageSize=20(1-100)；path?；visitorId?；startDay?；endDay?（日期格式 YYYY-MM-DD）',
      response: '{ items: { id: number; day: string; visitorId: UUID; path: string; pageTitle: string; referrer: string; ip: string | null; userAgent: string | null; createdAt: ISO时间 }[]; total: number; page: number; pageSize: number }' },
  ] },
  { audience: 'admin', module: '文件管理', endpoints: [
    { method: 'GET', path: `${admin}/files`, title: '分页查询文件', auth: true,
      request: 'Query: page=1；pageSize=20(1-100)；search?；mimeTypes?（逗号分隔 MIME 类型）',
      response: `{ items: ${fileItem}[]; total: number; page: number; pageSize: number }` },
    { method: 'POST', path: `${admin}/files`, title: '上传文件', auth: true,
      request: 'Body: 原始文件字节；Content-Type: image/png | image/jpeg | image/webp | image/x-icon | image/gif | application/pdf；X-File-Name: URL 编码文件名',
      response: fileItem, note: '最大 10 MiB；成功时 HTTP 201。' },
    { method: 'DELETE', path: `${admin}/files/:id`, title: '归档文件', auth: true,
      request: '路径: id=文件 UUID', response: 'null', note: '归档后不再列出，公开内容链接仍可访问。' },
  ] },
  { audience: 'public', module: '站点设置', endpoints: [
    { method: 'GET', path: `${publicApi}/site-settings`, title: '获取公开站点设置', auth: false,
      response: siteSettings },
    { method: 'GET', path: `${publicApi}/site-settings/:target/icon`, title: '获取站点图标', auth: false,
      request: '路径: target=admin | client；可带 ?v=图标版本用于缓存区分',
      response: '图片二进制，Content-Type 为实际图标 MIME', binary: true },
  ] },
  { audience: 'public', module: '文件访问', endpoints: [
    { method: 'GET', path: `${publicApi}/files/:id/content`, title: '读取文件内容', auth: false,
      request: '路径: id=文件 UUID', response: '文件二进制，Content-Type 为文件 MIME', binary: true,
      note: '已归档文件的旧链接仍可访问。' },
  ] },
  { audience: 'public', module: '访问统计', endpoints: [
    { method: 'POST', path: `${publicApi}/visits`, title: '上报页面访问', auth: false,
      request: 'JSON: { visitorId: UUID; path: 站内绝对路径; pageTitle?: string; referrer?: URL }',
      response: '{ recorded: boolean; day: YYYY-MM-DD }',
      note: '同一访客按 UTC 日期每天只记首次访问；新记录 HTTP 201，重复上报 HTTP 200。' },
  ] },
];

export const API_ENDPOINT_COUNT = API_GROUPS.reduce((count, group) => count + group.endpoints.length, 0);
