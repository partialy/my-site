import type { RequestHandler } from 'express';
import type { AdminSummary } from '../api/types';
import { OperationLogService } from '../services/operation-log.service';

interface OperationDescriptor {
  module: string;
  action: 'create' | 'update' | 'delete' | 'archive' | 'export';
  targetType: string;
  targetId?: string;
  summary: string;
  changedFields?: string[];
}

/** 仅映射框架内有明确业务含义的写操作，避免把每个 HTTP 请求当作审计。 */
function describe(method: string, path: string): OperationDescriptor | null {
  if (method === 'PUT' && path === '/auth/password') {
    return { module: '管理员', action: 'update', targetType: 'admin', summary: '修改管理员密码' };
  }
  if (method === 'POST' && path === '/backups/database') {
    return { module: '数据库备份', action: 'export', targetType: 'database', summary: '导出 SQLite 数据库备份' };
  }
  if (method === 'PUT' && path === '/system-config') {
    return { module: '系统配置', action: 'update', targetType: 'sys_config', summary: '修改日志设置',
      changedFields: ['requestLogMode', 'consoleLogEnabled', 'consoleLogFormat'] };
  }
  if (method === 'PUT' && path === '/upload-settings') {
    return { module: '上传设置', action: 'update', targetType: 'sys_config', summary: '修改上传策略与存储配置',
      changedFields: ['strategy', 'accessKey', 'secretKey', 'bucket', 'root', 'uploadUrl', 'domain'] };
  }
  const whitelist = /^\/system-config\/whitelist(?:\/([^/]+))?$/.exec(path);
  if (whitelist && ((method === 'POST' && !whitelist[1]) || (['PUT', 'DELETE'].includes(method) && whitelist[1]))) {
    const action = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete';
    return { module: '系统配置', action, targetType: 'request_log_whitelist',
      targetId: whitelist[1], summary: `${method === 'POST' ? '新增' : method === 'PUT' ? '修改' : '删除'}请求日志白名单规则` };
  }
  const config = /^\/configs(?:\/([^/]+))?$/.exec(path);
  if (config && ((method === 'POST' && !config[1]) || (['PUT', 'DELETE'].includes(method) && config[1]))) {
    const action = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete';
    return { module: '配置管理', action, targetType: 'config', targetId: config[1],
      summary: `${method === 'POST' ? '新增' : method === 'PUT' ? '修改' : '删除'}动态配置`,
      changedFields: method === 'DELETE' ? [] : ['name', 'value', 'enabled', 'remark'] };
  }
  const dictionaryBatch = /^\/dictionaries(?:\/([0-9a-f]{32})\/items)?\/batch$/.exec(path);
  if (method === 'POST' && dictionaryBatch) {
    const isItem = Boolean(dictionaryBatch[1]);
    return { module: '数据字典', action: 'create', targetType: isItem ? 'dict_item' : 'dict_type',
      summary: `批量新增字典${isItem ? '子项' : '类型'}` };
  }
  const dictionary = /^\/dictionaries(?:\/([0-9a-f]{32})(?:\/items(?:\/([0-9a-f]{32}))?)?)?$/.exec(path);
  if (dictionary && (method === 'POST' || method === 'PUT')) {
    const isItem = path.includes('/items');
    return {
      module: '数据字典', action: method === 'POST' ? 'create' : 'update',
      targetType: isItem ? 'dict_item' : 'dict_type',
      targetId: isItem ? dictionary[3] : dictionary[1],
      summary: `${method === 'POST' ? '新增' : '修改'}字典${isItem ? '子项' : '类型'}`,
      changedFields: isItem ? ['label', 'sort', 'enabled', 'color'] : ['name', 'remark', 'isPublic', 'enabled'],
    };
  }
  if (method === 'PUT' && path === '/menus') {
    return { module: '菜单管理', action: 'update', targetType: 'menu', summary: '保存菜单结构', changedFields: ['items'] };
  }
  if (method === 'PUT' && path === '/site-settings') {
    return { module: '站点设置', action: 'update', targetType: 'site_settings', summary: '修改站点设置',
      changedFields: ['projectName', 'admin.siteTitle', 'admin.systemName', 'client.siteTitle', 'client.systemName'] };
  }
  if (method === 'PUT' && path === '/site-settings/login-appearance') {
    return { module: '外观设置', action: 'update', targetType: 'site_settings', summary: '修改管理端登录外观',
      changedFields: ['backgroundMode', 'solidColor', 'gradientStartColor', 'gradientEndColor',
        'gradientDirection', 'backgroundFileId', 'cardOpacity'] };
  }
  const icon = /^\/site-settings\/(admin|client)\/icon(?:-file)?$/.exec(path);
  if (icon && ['PUT', 'DELETE'].includes(method)) {
    return { module: '站点设置', action: method === 'PUT' ? 'update' : 'delete', targetType: 'site_icon',
      targetId: icon[1], summary: method === 'PUT' ? '设置站点图标' : '删除站点图标' };
  }
  if (method === 'POST' && path === '/files') {
    return { module: '文件管理', action: 'create', targetType: 'file', summary: '上传文件' };
  }
  const file = /^\/files\/([^/]+)$/.exec(path);
  if (method === 'DELETE' && file) {
    return { module: '文件管理', action: 'archive', targetType: 'file', targetId: file[1], summary: '归档文件' };
  }
  const restoredFile = /^\/files\/([^/]+)\/restore$/.exec(path);
  if (method === 'PUT' && restoredFile) {
    return { module: '文件管理', action: 'update', targetType: 'file', targetId: restoredFile[1], summary: '恢复归档文件' };
  }
  const permanentFile = /^\/files\/([^/]+)\/permanent$/.exec(path);
  if (method === 'DELETE' && permanentFile) {
    return { module: '文件管理', action: 'delete', targetType: 'file', targetId: permanentFile[1], summary: '永久删除文件' };
  }
  if (method === 'PUT' && path === '/works/reorder') {
    return { module: '作品管理', action: 'update', targetType: 'work', summary: '调整作品排序与首页展示', changedFields: ['sortOrder', 'featuredHome'] };
  }
  const work = /^\/works(?:\/([0-9a-f]{32}))?$/.exec(path);
  if (work && ((method === 'POST' && !work[1]) || (['PUT', 'DELETE'].includes(method) && work[1]))) {
    const action = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete';
    return {
      module: '作品管理',
      action,
      targetType: 'work',
      targetId: work[1],
      summary: `${method === 'POST' ? '新增' : method === 'PUT' ? '修改' : '删除'}作品`,
      changedFields: method === 'DELETE' ? [] : ['name', 'slug', 'category', 'version', 'status', 'featuredHome'],
    };
  }
  if (method === 'PUT' && path === '/profile-settings') {
    return {
      module: '主页配置',
      action: 'update',
      targetType: 'sys_config',
      summary: '修改个人主页与关于页配置',
      changedFields: ['site', 'footer', 'about'],
    };
  }
  return null;
}

/** 挂载于 /api/v1/admin 路由之前；requireAuth 执行后会在 res.locals.admin 写入操作人。 */
export function operationAuditMiddleware(service: OperationLogService): RequestHandler {
  return (req, res, next) => {
    const descriptor = describe(req.method, req.path);
    if (!descriptor) return next();
    const start = performance.now();
    res.once('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 400) return;
      const admin = res.locals.admin as AdminSummary | undefined;
      if (!admin) return;
      try {
        service.record({
          actor: { type: 'admin', id: admin.id, name: admin.username },
          module: descriptor.module, action: descriptor.action,
          targetType: descriptor.targetType, targetId: res.locals.operationTargetId ?? descriptor.targetId,
          summary: descriptor.summary, changedFields: descriptor.changedFields, ip: req.ip,
          durationMs: performance.now() - start,
        });
      } catch (error) {
        console.error('写入操作审计日志失败', error);
      }
    });
    next();
  };
}
