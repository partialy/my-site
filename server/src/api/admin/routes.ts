import { Router, raw } from 'express';
import { setupAdminSchema, loginSchema, changePasswordSchema, resetPasswordSchema } from '../schemas';
import { parseInput } from '../validation';
import { ok } from '../types';
import { requireAuth, authenticatedAdmin } from '../../middleware/auth.middleware';
import { SetupService } from '../../services/setup.service';
import { AuthService } from '../../services/auth.service';
import { SystemConfigService, systemConfigInputSchema, whitelistInputSchema } from '../../services/system-config.service';
import { ConfigService, configInputSchema } from '../../services/config.service';
import {
  iconMimeTypes, loginAppearanceInputSchema, maxIconBytes, SiteSettingsService, siteSettingsInputSchema, siteTargetSchema,
  type IconMimeType,
} from '../../services/site-settings.service';
import { ApiError } from '../api-error';
import { ApiCode } from '../codes';
import { RequestLogService, requestLogCleanupSchema, requestLogQuerySchema } from '../../services/request-log.service';
import { FileService, fileBatchDeleteSchema, fileIdSchema, fileListQuerySchema, fileMimeTypes, maxFileBytes, selectIconFileSchema,
  type FileMimeType } from '../../services/file.service';
import { MenuService, menuInputSchema } from '../../services/menu.service';
import { DashboardService } from '../../services/dashboard.service';
import { VisitService, visitQuerySchema } from '../../services/visit.service';
import { OperationLogService, operationLogQuerySchema } from '../../services/operation-log.service';
import { DatabaseBackupService } from '../../services/database-backup.service';
import { ConfigPackageService } from '../../services/config-package.service';
import { SystemStatusService } from '../../services/system-status.service';
import { requestRateLimit } from '../../middleware/rate-limit.middleware';
import { UploadSettingsService, uploadSettingsSchema } from '../../services/upload-settings.service';
import { ApiDocsService, apiDocDetailQuerySchema, apiDocsCatalogQuerySchema } from '../../services/api-docs.service';

export function createAdminRoutes(setup: SetupService, auth: AuthService, systemConfig: SystemConfigService, configs: ConfigService, siteSettings: SiteSettingsService, requestLogs: RequestLogService, files: FileService, menus: MenuService, dashboard: DashboardService, visits: VisitService, operationLogs: OperationLogService, backups: DatabaseBackupService, configPackages: ConfigPackageService, status: SystemStatusService, uploadSettings: UploadSettingsService, apiDocs: ApiDocsService): Router {
  const routes = Router();

  routes.get('/setup/status', (_req, res) => {
    res.json(ok({ initialized: setup.isInitialized() }));
  });

  routes.post('/setup/admin', async (req, res) => {
    const input = parseInput(setupAdminSchema, req.body);
    const admin = await setup.createInitialAdmin(input);
    res.status(201).json(ok(admin, '管理员初始化成功'));
  });

  routes.post('/auth/login', async (req, res) => {
    const input = parseInput(loginSchema, req.body);
    res.json(ok(await auth.login(input), '登录成功'));
  });

  routes.get('/auth/me', requireAuth(auth), (_req, res) => {
    res.json(ok(authenticatedAdmin(res)));
  });

  routes.put('/auth/password', requireAuth(auth), async (req, res) => {
    const input = parseInput(changePasswordSchema, req.body);
    authenticatedAdmin(res);
    await auth.changePassword(input);
    res.json(ok(null, '密码修改成功，请重新登录'));
  });

  routes.post('/auth/reset-password', async (req, res) => {
    const input = parseInput(resetPasswordSchema, req.body);
    await auth.resetPassword(input);
    res.json(ok(null, '密码重置成功，请使用新密码登录'));
  });

  routes.get('/system-config', requireAuth(auth), (_req, res) => {
    res.json(ok(systemConfig.get()));
  });

  routes.put('/system-config', requireAuth(auth), (req, res) => {
    const input = parseInput(systemConfigInputSchema, req.body);
    res.json(ok(systemConfig.update(input), '系统配置已保存'));
  });

  routes.get('/system-config/whitelist', requireAuth(auth), (_req, res) => {
    res.json(ok(systemConfig.getWhitelist()));
  });

  routes.post('/system-config/whitelist', requireAuth(auth), (req, res) => {
    const input = parseInput(whitelistInputSchema, req.body);
    res.status(201).json(ok(systemConfig.createRule(input), '白名单规则已创建'));
  });

  routes.put('/system-config/whitelist/:id', requireAuth(auth), (req, res) => {
    const input = parseInput(whitelistInputSchema, req.body);
    res.json(ok(systemConfig.updateRule(String(req.params.id), input), '白名单规则已更新'));
  });

  routes.delete('/system-config/whitelist/:id', requireAuth(auth), (req, res) => {
    systemConfig.deleteRule(String(req.params.id));
    res.json(ok(null, '白名单规则已删除'));
  });

  routes.get('/configs', requireAuth(auth), (_req, res) => {
    res.json(ok(configs.list()));
  });

  routes.post('/configs', requireAuth(auth), (req, res) => {
    const input = parseInput(configInputSchema, req.body);
    const item = configs.create(input);
    res.locals.operationTargetId = item.key;
    res.status(201).json(ok(item, '配置已创建'));
  });

  routes.put('/configs/:key', requireAuth(auth), (req, res) => {
    const input = parseInput(configInputSchema, req.body);
    res.json(ok(configs.update(String(req.params.key), input), '配置已更新'));
  });

  routes.delete('/configs/:key', requireAuth(auth), (req, res) => {
    configs.delete(String(req.params.key));
    res.json(ok(null, '配置已删除'));
  });

  routes.get('/menus', requireAuth(auth), (_req, res) => {
    res.json(ok(menus.list()));
  });

  routes.put('/menus', requireAuth(auth), (req, res) => {
    const input = parseInput(menuInputSchema, req.body);
    res.json(ok(menus.replace(input), '菜单已保存'));
  });

  routes.get('/site-settings', (_req, res) => {
    res.json(ok(siteSettings.get()));
  });

  routes.put('/site-settings', requireAuth(auth), (req, res) => {
    const input = parseInput(siteSettingsInputSchema, req.body);
    res.json(ok(siteSettings.update(input), '站点配置已保存'));
  });

  routes.put('/site-settings/login-appearance', requireAuth(auth), (req, res) => {
    res.json(ok(siteSettings.updateLoginAppearance(parseInput(loginAppearanceInputSchema, req.body)), '登录外观已保存'));
  });

  routes.put('/site-settings/:target/icon', requireAuth(auth), requestRateLimit(20, 60_000), raw({ type: [...iconMimeTypes], limit: maxIconBytes }), async (req, res) => {
    const target = parseInput(siteTargetSchema, req.params.target);
    const mime = req.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (!iconMimeTypes.includes(mime as IconMimeType) || !Buffer.isBuffer(req.body)) {
      throw new ApiError(415, ApiCode.ValidationError, '请上传 PNG、JPEG、WebP 或 ICO 图标', { fieldErrors: { icon: ['文件类型无效'] } });
    }
    res.json(ok(await siteSettings.uploadIcon(target, mime as IconMimeType, req.body), '图标已上传'));
  });

  routes.put('/site-settings/:target/icon-file', requireAuth(auth), (req, res) => {
    const target = parseInput(siteTargetSchema, req.params.target);
    const { fileId } = parseInput(selectIconFileSchema, req.body);
    res.json(ok(siteSettings.selectIconFile(target, fileId), '图标已设置'));
  });

  routes.delete('/site-settings/:target/icon', requireAuth(auth), async (req, res) => {
    const target = parseInput(siteTargetSchema, req.params.target);
    res.json(ok(await siteSettings.deleteIcon(target), '图标已删除'));
  });

  routes.get('/request-logs', requireAuth(auth), (req, res) => {
    const query = parseInput(requestLogQuerySchema, req.query);
    res.json(ok(requestLogs.list(query)));
  });

  routes.get('/operation-logs', requireAuth(auth), (req, res) => {
    res.json(ok(operationLogs.list(parseInput(operationLogQuerySchema, req.query))));
  });

  routes.get('/system-status', requireAuth(auth), async (_req, res) => {
    res.json(ok(await status.get()));
  });

  routes.post('/backups/database', requireAuth(auth), async (_req, res, next) => {
    const backup = await backups.create();
    res.download(backup.filePath, backup.fileName, { headers: { 'Cache-Control': 'no-store' } }, (error) => {
      void backups.remove(backup.filePath).catch((cleanupError) => console.error('备份临时文件清理失败', cleanupError));
      if (error && !res.headersSent) next(error);
    });
  });

  routes.get('/backups/config-package', requireAuth(auth), (_req, res) => {
    const pkg = configPackages.exportZip();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${pkg.fileName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(pkg.buffer);
  });

  routes.post(
    '/backups/config-package/import',
    requireAuth(auth),
    raw({ type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'], limit: '10mb' }),
    (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new ApiError(400, ApiCode.ValidationError, '请上传有效的 ZIP 配置包文件', {
          fieldErrors: { file: ['请上传非空 .zip 文件'] },
        });
      }
      res.json(ok(configPackages.importZip(req.body), '配置包导入成功'));
    },
  );

  routes.delete('/request-logs', requireAuth(auth), (req, res) => {
    const input = parseInput(requestLogCleanupSchema, req.body);
    res.json(ok(requestLogs.cleanup(input), '请求日志已清理'));
  });

  routes.get('/home', requireAuth(auth), (_req, res) => {
    res.json(ok(dashboard.get()));
  });

  routes.get('/visits', requireAuth(auth), (req, res) => {
    res.json(ok(visits.list(parseInput(visitQuerySchema, req.query))));
  });

  routes.get('/files', requireAuth(auth), (req, res) => {
    res.json(ok(files.list(parseInput(fileListQuerySchema, req.query))));
  });

  routes.get('/upload-settings', requireAuth(auth), (_req, res) => {
    res.json(ok(uploadSettings.get()));
  });

  routes.put('/upload-settings', requireAuth(auth), (req, res) => {
    res.json(ok(uploadSettings.update(parseInput(uploadSettingsSchema, req.body)), '上传设置已保存'));
  });

  routes.post('/files', requireAuth(auth), requestRateLimit(60, 60_000), raw({ type: () => true, limit: maxFileBytes }), async (req, res) => {
    const mime = req.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (!fileMimeTypes.includes(mime as FileMimeType) || !Buffer.isBuffer(req.body)) {
      throw new ApiError(415, ApiCode.ValidationError, '不支持的文件类型', { fieldErrors: { file: ['只支持 PNG、JPEG、WebP、ICO、GIF、PDF'] } });
    }
    const encodedName = req.get('x-file-name');
    let name: string;
    try { name = encodedName ? decodeURIComponent(encodedName) : ''; }
    catch { throw new ApiError(400, ApiCode.ValidationError, '文件名编码无效', { fieldErrors: { name: ['文件名编码无效'] } }); }
    const item = await files.upload(name, mime as FileMimeType, req.body);
    res.locals.operationTargetId = item.id;
    res.status(201).json(ok(item, '文件已上传'));
  });

  routes.delete('/files/:id', requireAuth(auth), (req, res) => {
    files.archive(parseInput(fileIdSchema, req.params.id));
    res.json(ok(null, '文件已归档'));
  });

  routes.put('/files/:id/restore', requireAuth(auth), (req, res) => {
    files.restore(parseInput(fileIdSchema, req.params.id));
    res.json(ok(null, '文件已恢复'));
  });

  routes.delete('/files/:id/permanent', requireAuth(auth), async (req, res) => {
    await files.deletePermanently(parseInput(fileIdSchema, req.params.id));
    res.json(ok(null, '文件已永久删除'));
  });

  routes.post('/files/batch-delete', requireAuth(auth), async (req, res) => {
    const { ids } = parseInput(fileBatchDeleteSchema, req.body);
    const result = await files.deleteBatchPermanently(ids);
    res.locals.operationTargetId = result.deletedIds.join(',');
    res.json(ok(result, result.failed.length > 0
      ? `已删除 ${result.deletedCount} 个文件，${result.failed.length} 个跳过`
      : `已永久删除 ${result.deletedCount} 个文件`));
  });

  routes.get('/api-docs', requireAuth(auth), (req, res) => {
    const { search } = parseInput(apiDocsCatalogQuerySchema, req.query);
    res.json(ok(apiDocs.getCatalog(search)));
  });

  routes.get('/api-docs/detail', requireAuth(auth), (req, res) => {
    const { docPath } = parseInput(apiDocDetailQuerySchema, req.query);
    res.json(ok(apiDocs.getDetail(docPath)));
  });

  routes.get('/api-docs/export', requireAuth(auth), (_req, res) => {
    res.json(ok(apiDocs.exportMarkdown()));
  });

  return routes;
}
