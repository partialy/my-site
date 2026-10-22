import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { AppConfig } from './config/env';
import { ApiError } from './api/api-error';
import { ApiCode } from './api/codes';
import { createAdminRoutes } from './api/admin/routes';
import { createPublicRoutes } from './api/public-routes';
import { AuthService } from './services/auth.service';
import { SetupService } from './services/setup.service';
import { SystemConfigService } from './services/system-config.service';
import { requestLogMiddleware } from './middleware/request-log.middleware';
import type Database from 'better-sqlite3';
import { ConfigService } from './services/config.service';
import { SiteSettingsService } from './services/site-settings.service';
import { RequestLogService } from './services/request-log.service';
import { FileService } from './services/file.service';
import { MenuService } from './services/menu.service';
import { VisitService } from './services/visit.service';
import { DashboardService } from './services/dashboard.service';
import { UserService } from './services/user.service';
import { createUserRoutes } from './api/user-routes';
import { createAdminUserRoutes } from './api/admin/user-routes';
import { OperationLogService } from './services/operation-log.service';
import { operationAuditMiddleware } from './middleware/operation-audit.middleware';
import { DatabaseBackupService } from './services/database-backup.service';
import { SystemStatusService } from './services/system-status.service';
import { loginFailureLimit, requestRateLimit } from './middleware/rate-limit.middleware';
import { DictionaryService } from './services/dictionary.service';
import { createDictionaryRoutes } from './api/dictionary-routes';
import { createAdminDictionaryRoutes } from './api/admin/dictionary-routes';
import { UploadSettingsService } from './services/upload-settings.service';
import { createUploadRoutes } from './api/upload-routes';
import { PaymentSettingsService } from './services/payment-settings.service';
import { createPaymentSettingsRoutes } from './api/admin/payment-settings.routes';

interface AppServices {
  setup: SetupService;
  auth: AuthService;
  systemConfig: SystemConfigService;
  configs: ConfigService;
  siteSettings: SiteSettingsService;
  requestLogs: RequestLogService;
  files: FileService;
  menus: MenuService;
  visits: VisitService;
  dashboard: DashboardService;
  users: UserService;
  operationLogs: OperationLogService;
  backups: DatabaseBackupService;
  status: SystemStatusService;
  dictionaries: DictionaryService;
  uploadSettings: UploadSettingsService;
  paymentSettings: PaymentSettingsService;
}

export function createApp(config: AppConfig, services: AppServices, db: Database.Database) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustedProxies) app.set('trust proxy', config.trustedProxies);
  app.use(helmet());
  app.get('/health', (_req, res) => {
    const ready = services.status.isReady();
    res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
  });
  app.use('/api/v1', requestLogMiddleware(services.systemConfig, db));
  const adminCors = cors({
    origin(origin, callback) {
      if (!origin || origin === config.adminOrigin) return callback(null, true);
      callback(new ApiError(403, ApiCode.Failure, '跨域来源未被允许'));
    },
  });
  const publicCors = cors({ origin: '*' });
  app.use((req, res, next) => {
    const publicPath = req.path === '/api/v1/visits' || req.path.startsWith('/api/v1/users/') ||
      req.path.startsWith('/api/v1/uploads/') ||
      req.path === '/api/v1/site-settings' || req.path === '/api/v1/dictionaries' ||
      /^\/api\/v1\/files\/[^/]+\/content$/.test(req.path) ||
      /^\/api\/v1\/site-settings\/(admin|client)\/icon$/.test(req.path);
    if (publicPath && !req.path.startsWith('/api/v1/admin/')) return publicCors(req, res, next);
    return adminCors(req, res, next);
  });
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1/admin/auth/login', loginFailureLimit());
  app.use('/api/v1/users/login', loginFailureLimit());
  app.use('/api/v1/admin/setup/admin', requestRateLimit(5, 15 * 60_000));
  app.use('/api/v1/users/register', requestRateLimit(10, 60_000));
  app.use('/api/v1/visits', requestRateLimit(60, 60_000));
  app.use('/api/v1/admin', operationAuditMiddleware(services.operationLogs));
  app.use('/api/v1/admin', createAdminRoutes(
    services.setup, services.auth, services.systemConfig, services.configs,
    services.siteSettings, services.requestLogs, services.files, services.menus, services.dashboard, services.visits,
    services.operationLogs, services.backups, services.status, services.uploadSettings,
  ));
  app.use('/api/v1/admin/payment-settings', createPaymentSettingsRoutes(services.auth, services.paymentSettings));
  app.use('/api/v1/admin/users', createAdminUserRoutes(services.auth, services.users));
  app.use('/api/v1/admin/dictionaries', createAdminDictionaryRoutes(services.auth, services.dictionaries));
  app.use('/api/v1/users', createUserRoutes(services.users));
  app.use('/api/v1/dictionaries', createDictionaryRoutes(services.dictionaries));
  app.use('/api/v1/uploads', createUploadRoutes(services.files));
  app.use('/api/v1', createPublicRoutes(services.siteSettings, services.files, services.visits));
  app.use('/api/v1', (_req, res) => {
    res.status(404).json({ code: ApiCode.NotFound, msg: '接口不存在', data: null, success: false });
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({
        code: error.code,
        msg: error.message,
        data: error.data,
        success: false,
      });
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({
        code: ApiCode.ValidationError,
        msg: '请求 JSON 格式错误',
        data: { fieldErrors: { body: ['请求 JSON 格式错误'] } },
        success: false,
      });
      return;
    }
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
      res.status(413).json({ code: ApiCode.ValidationError, msg: '请求内容超过大小限制', data: { fieldErrors: { file: ['文件超过接口大小限制'] } }, success: false });
      return;
    }
    console.error('未处理的服务端错误', error);
    res.status(500).json({ code: ApiCode.Failure, msg: '服务器内部错误', data: null, success: false });
  };
  app.use(errorHandler);
  return app;
}
