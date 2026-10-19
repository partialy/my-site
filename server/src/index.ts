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

function main(): void {
  const config = loadConfig();
  const db = openDatabase(config.sqlitePath);
  const admins = new AdminRepository(db);
  const setup = new SetupService(admins, config.setupKey);
  const auth = new AuthService(admins, new JwtService(config.jwtSecret));
  const configManager = new ConfigManager(new ConfigRepository(db));
  const systemConfig = new SystemConfigService(configManager, db);
  const configs = new ConfigService(configManager);
  const siteSettings = new SiteSettingsService(configManager);
  const app = createApp(config, setup, auth, systemConfig, configs, siteSettings, db);
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
