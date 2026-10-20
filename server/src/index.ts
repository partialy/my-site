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
import { UserRepository } from './repositories/user.repository';
import { UserJwtService } from './security/user-jwt.service';
import { UserService } from './services/user.service';
import { OperationLogRepository } from './repositories/operation-log.repository';
import { OperationLogService } from './services/operation-log.service';
import { DatabaseBackupService } from './services/database-backup.service';
import { SystemStatusService } from './services/system-status.service';

function main(): void {
  const config = loadConfig();
  const db = openDatabase(config.sqlitePath);
  const admins = new AdminRepository(db);
  const configManager = new ConfigManager(new ConfigRepository(db));
  const setup = new SetupService(admins, config.setupKey, new SetupRepository(db), configManager);
  const auth = new AuthService(admins, new JwtService(config.jwtSecret));
  const systemConfig = new SystemConfigService(configManager, db);
  const configs = new ConfigService(configManager);
  const files = new FileService(new FileRepository(db));
  const siteSettings = new SiteSettingsService(configManager, files);
  const requestLogs = new RequestLogService(new RequestLogRepository(db));
  const menus = new MenuService(new MenuRepository(db));
  const visits = new VisitService(new VisitRepository(db));
  const users = new UserService(new UserRepository(db), new UserJwtService(config.jwtSecret));
  const operationLogs = new OperationLogService(new OperationLogRepository(db));
  const backups = new DatabaseBackupService(db);
  const status = new SystemStatusService(db, config.sqlitePath);
  const dashboard = new DashboardService(visits, requestLogs, users);
  const app = createApp(config, {
    setup, auth, systemConfig, configs, siteSettings, requestLogs, files, menus, visits, dashboard,
    users, operationLogs, backups, status,
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
