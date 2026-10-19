import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import type { AppConfig } from './config/env';
import { ApiError } from './api/api-error';
import { ApiCode } from './api/codes';
import { createRoutes } from './api/routes';
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

export function createApp(config: AppConfig, setup: SetupService, auth: AuthService, systemConfig: SystemConfigService, configs: ConfigService, siteSettings: SiteSettingsService, requestLogs: RequestLogService, files: FileService, menus: MenuService, db: Database.Database) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api/v1', requestLogMiddleware(systemConfig, db));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === config.adminOrigin) return callback(null, true);
      callback(new ApiError(403, ApiCode.Failure, '跨域来源未被允许'));
    },
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1', createRoutes(setup, auth, systemConfig, configs, siteSettings, requestLogs, files, menus));
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
