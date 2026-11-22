import { createApp } from './app';
import { loadConfig } from './config/env';
import { openDatabase } from './db/database';
import { AdminRepository } from './repositories/admin.repository';
import { JwtService } from './security/jwt.service';
import { AuthService } from './services/auth.service';
import { SetupService } from './services/setup.service';
import { SetupRepository } from './repositories/setup.repository';
import { ConfigRepository } from './repositories/config.repository';
import { ConfigManager } from './config/config-manager';
import { SystemConfigService } from './services/system-config.service';
import { ConfigService } from './services/config.service';
import { SiteSettingsService } from './services/site-settings.service';
import { RequestLogRepository } from './repositories/request-log.repository';
import { RequestLogService } from './services/request-log.service';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';
import { MenuRepository } from './repositories/menu.repository';
import { MenuService } from './services/menu.service';
import { VisitRepository } from './repositories/visit.repository';
import { VisitService } from './services/visit.service';
import { DashboardService } from './services/dashboard.service';
import { OperationLogRepository } from './repositories/operation-log.repository';
import { OperationLogService } from './services/operation-log.service';
import { DatabaseBackupService } from './services/database-backup.service';
import { SystemStatusService } from './services/system-status.service';
import { DictionaryRepository } from './repositories/dictionary.repository';
import { DictionaryService } from './services/dictionary.service';
import { UploadSettingsService } from './services/upload-settings.service';
import { ApiDocsService } from './services/api-docs.service';

function main(): void {
  const config = loadConfig();
  const db = openDatabase(config.sqlitePath, config.nodeEnv !== 'production');
  const admins = new AdminRepository(db);
  const configManager = new ConfigManager(new ConfigRepository(db));
  const setup = new SetupService(admins, config.setupKey, new SetupRepository(db), configManager);
  const auth = new AuthService(admins, new JwtService(config.jwtSecret), config.setupKey);
  const systemConfig = new SystemConfigService(configManager, db);
  const configs = new ConfigService(configManager);
  const uploadSettings = new UploadSettingsService(configManager);
  const files = new FileService(new FileRepository(db), configManager, uploadSettings);
  const siteSettings = new SiteSettingsService(configManager, files);
  const requestLogs = new RequestLogService(new RequestLogRepository(db));
  const menus = new MenuService(new MenuRepository(db));
  const visits = new VisitService(new VisitRepository(db));
  const operationLogs = new OperationLogService(new OperationLogRepository(db));
  const backups = new DatabaseBackupService(db);
  const status = new SystemStatusService(db, config.sqlitePath);
  const dictionaries = new DictionaryService(new DictionaryRepository(db));
  const dashboard = new DashboardService(visits, requestLogs);
  const apiDocs = new ApiDocsService();
  const app = createApp(config, {
    setup, auth, systemConfig, configs, siteSettings, requestLogs, files, menus, visits, dashboard,
    operationLogs, backups, status, dictionaries, uploadSettings, apiDocs,
  }, db);
  const server = app.listen(config.port, () => {
    console.log(`server 已启动，端口 ${config.port}`);
  });
  const stop = () => server.close(() => db.close());
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

try {
  main();
} catch (error) {
  console.error('server 启动失败', error);
  process.exitCode = 1;
}
