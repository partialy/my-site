const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { openDatabase } = require('../dist/db/database');
const { createApp } = require('../dist/app');
const { AdminRepository } = require('../dist/repositories/admin.repository');
const { JwtService } = require('../dist/security/jwt.service');
const { AuthService } = require('../dist/services/auth.service');
const { SetupService } = require('../dist/services/setup.service');
const { ConfigRepository } = require('../dist/repositories/config.repository');
const { ConfigManager } = require('../dist/config/config-manager');
const { SystemConfigService } = require('../dist/services/system-config.service');
const { ConfigService } = require('../dist/services/config.service');
const { SiteSettingsService } = require('../dist/services/site-settings.service');
const { RequestLogRepository } = require('../dist/repositories/request-log.repository');
const { RequestLogService } = require('../dist/services/request-log.service');
const { FileRepository } = require('../dist/repositories/file.repository');
const { FileService } = require('../dist/services/file.service');
const { MenuRepository } = require('../dist/repositories/menu.repository');
const { MenuService } = require('../dist/services/menu.service');

async function main() {
  const concurrentDb = openDatabase(':memory:');
  try {
    const concurrentSetup = new SetupService(new AdminRepository(concurrentDb), 'smoke-test-setup-key');
    const attempts = await Promise.allSettled([
      concurrentSetup.createInitialAdmin({ username: 'admin', password: 'strong-password-123', setupKey: 'smoke-test-setup-key' }),
      concurrentSetup.createInitialAdmin({ username: 'admin2', password: 'strong-password-123', setupKey: 'smoke-test-setup-key' }),
    ]);
    assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1);
    assert.equal(attempts.filter((attempt) => attempt.status === 'rejected' && attempt.reason.code === 1003).length, 1);
  } finally {
    concurrentDb.close();
  }

  const db = openDatabase(':memory:');
  const admins = new AdminRepository(db);
  const config = {
    port: 0,
    jwtSecret: 'smoke-test-secret-at-least-32-characters',
    setupKey: 'smoke-test-setup-key',
    sqlitePath: ':memory:',
    adminOrigin: 'http://localhost:5173',
  };
  const manager = new ConfigManager(new ConfigRepository(db));
  const systemConfig = new SystemConfigService(manager, db);
  const files = new FileService(new FileRepository(db));
  const app = createApp(config, new SetupService(admins, config.setupKey), new AuthService(admins, new JwtService(config.jwtSecret)), systemConfig, new ConfigService(manager), new SiteSettingsService(manager, files), new RequestLogService(new RequestLogRepository(db)), files, new MenuService(new MenuRepository(db)), db);
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const request = async (path, method = 'GET', body, token) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, body: await response.json() };
    };

    let result = await request('/setup/status');
    assert.equal(result.body.data.initialized, false);
    result = await request('/setup/admin', 'POST', { username: 'admin', password: 'strong-password-123', setupKey: 'wrong-key' });
    assert.equal(result.body.code, 1002);
    result = await request('/setup/admin', 'POST', { username: 'admin', password: 'strong-password-123', setupKey: config.setupKey });
    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    result = await request('/setup/admin', 'POST', { username: 'admin2', password: 'strong-password-123', setupKey: config.setupKey });
    assert.equal(result.body.code, 1003);
    result = await request('/auth/login', 'POST', { username: 'admin', password: 'wrong-password-123' });
    assert.equal(result.body.code, 1004);
    result = await request('/auth/login', 'POST', { username: 'admin', password: 'strong-password-123' });
    const token = result.body.data.token;
    assert.equal(result.body.data.expiresIn, 43200);
    result = await request('/auth/me', 'GET', undefined, token);
    assert.equal(result.body.data.username, 'admin');
    result = await request('/auth/me');
    assert.equal(result.body.code, 1005);
    const expired = jwt.sign({ ver: 0, exp: Math.floor(Date.now() / 1000) - 1 }, config.jwtSecret, {
      algorithm: 'HS256', subject: '1', issuer: 'nodebase-server',
    });
    result = await request('/auth/me', 'GET', undefined, expired);
    assert.equal(result.body.code, 1007);
    result = await request('/auth/password', 'PUT', { oldPassword: 'strong-password-123', newPassword: 'another-strong-password-123' }, token);
    assert.equal(result.body.code, 0);
    result = await request('/auth/me', 'GET', undefined, token);
    assert.equal(result.body.code, 1006);
    console.log('server 关键流程验证通过');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
