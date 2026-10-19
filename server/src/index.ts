import { createApp } from './app';
import { loadConfig } from './config/env';
import { openDatabase } from './db/database';
import { AdminRepository } from './repositories/admin.repository';
import { JwtService } from './security/jwt.service';
import { AuthService } from './services/auth.service';
import { SetupService } from './services/setup.service';
import { ConfigRepository } from './repositories/config.repository';
import { ConfigManager } from './config/config-manager';
import { SystemConfigService } from './services/system-config.service';
import { ConfigService } from './services/config.service';
import { SiteSettingsService } from './services/site-settings.service';
import { RequestLogRepository } from './repositories/request-log.repository';
import { RequestLogService } from './services/request-log.service';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';

function main(): void {
  const config = loadConfig();
  const db = openDatabase(config.sqlitePath);
  const admins = new AdminRepository(db);
  const setup = new SetupService(admins, config.setupKey);
  const auth = new AuthService(admins, new JwtService(config.jwtSecret));
  const configManager = new ConfigManager(new ConfigRepository(db));
  const systemConfig = new SystemConfigService(configManager, db);
  const configs = new ConfigService(configManager);
  const files = new FileService(new FileRepository(db));
  const siteSettings = new SiteSettingsService(configManager, files);
  const requestLogs = new RequestLogService(new RequestLogRepository(db));
  const app = createApp(config, setup, auth, systemConfig, configs, siteSettings, requestLogs, files, db);
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
