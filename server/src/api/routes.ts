import { Router, raw } from 'express';
import { setupAdminSchema, loginSchema, changePasswordSchema } from './schemas';
import { parseInput } from './validation';
import { ok } from './types';
import { requireAuth, authenticatedAdmin } from '../middleware/auth.middleware';
import { SetupService } from '../services/setup.service';
import { AuthService } from '../services/auth.service';
import { SystemConfigService, systemConfigInputSchema, whitelistInputSchema } from '../services/system-config.service';
import { ConfigService, configInputSchema } from '../services/config.service';
import {
  iconMimeTypes, maxIconBytes, SiteSettingsService, siteSettingsInputSchema, siteTargetSchema,
  type IconMimeType,
} from '../services/site-settings.service';
import { ApiError } from './api-error';
import { ApiCode } from './codes';
import { RequestLogService, requestLogQuerySchema } from '../services/request-log.service';
import { FileService, fileIdSchema, fileListQuerySchema, fileMimeTypes, maxFileBytes, selectIconFileSchema,
  type FileMimeType } from '../services/file.service';

export function createRoutes(setup: SetupService, auth: AuthService, systemConfig: SystemConfigService, configs: ConfigService, siteSettings: SiteSettingsService, requestLogs: RequestLogService, files: FileService): Router {
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
    res.status(201).json(ok(configs.create(input), '配置已创建'));
  });

  routes.put('/configs/:key', requireAuth(auth), (req, res) => {
    const input = parseInput(configInputSchema, req.body);
    res.json(ok(configs.update(String(req.params.key), input), '配置已更新'));
  });

  routes.delete('/configs/:key', requireAuth(auth), (req, res) => {
    configs.delete(String(req.params.key));
    res.json(ok(null, '配置已删除'));
  });

  routes.get('/site-settings', (_req, res) => {
    res.json(ok(siteSettings.get()));
  });

  routes.put('/site-settings', requireAuth(auth), (req, res) => {
    const input = parseInput(siteSettingsInputSchema, req.body);
    res.json(ok(siteSettings.update(input), '站点配置已保存'));
  });

  routes.get('/site-settings/:target/icon', async (req, res) => {
    const target = parseInput(siteTargetSchema, req.params.target);
    const icon = await siteSettings.readIcon(target);
    res.set('Content-Type', icon.mime);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-cache');
    res.send(icon.bytes);
  });

  routes.put('/site-settings/:target/icon', requireAuth(auth), raw({ type: [...iconMimeTypes], limit: maxIconBytes }), async (req, res) => {
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

  routes.get('/files', requireAuth(auth), (req, res) => {
    res.json(ok(files.list(parseInput(fileListQuerySchema, req.query))));
  });

  routes.post('/files', requireAuth(auth), raw({ type: () => true, limit: maxFileBytes }), async (req, res) => {
    const mime = req.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    if (!fileMimeTypes.includes(mime as FileMimeType) || !Buffer.isBuffer(req.body)) {
      throw new ApiError(415, ApiCode.ValidationError, '不支持的文件类型', { fieldErrors: { file: ['只支持 PNG、JPEG、WebP、ICO、GIF、PDF'] } });
    }
    const encodedName = req.get('x-file-name');
    let name: string;
    try { name = encodedName ? decodeURIComponent(encodedName) : ''; }
    catch { throw new ApiError(400, ApiCode.ValidationError, '文件名编码无效', { fieldErrors: { name: ['文件名编码无效'] } }); }
    res.status(201).json(ok(await files.upload(name, mime as FileMimeType, req.body), '文件已上传'));
  });

  routes.get('/files/:id/content', async (req, res) => {
    const { item, bytes } = await files.read(parseInput(fileIdSchema, req.params.id));
    res.set('Content-Type', item.mimeType);
    res.set('Content-Length', String(item.size));
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(bytes);
  });

  routes.delete('/files/:id', requireAuth(auth), (req, res) => {
    files.archive(parseInput(fileIdSchema, req.params.id));
    res.json(ok(null, '文件已归档'));
  });

  return routes;
}
