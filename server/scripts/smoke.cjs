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
const { VisitRepository } = require('../dist/repositories/visit.repository');
const { VisitService } = require('../dist/services/visit.service');
const { DashboardService } = require('../dist/services/dashboard.service');

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
  const requestLogs = new RequestLogService(new RequestLogRepository(db));
  const visits = new VisitService(new VisitRepository(db));
  const app = createApp(config, {
    setup: new SetupService(admins, config.setupKey),
    auth: new AuthService(admins, new JwtService(config.jwtSecret)),
    systemConfig,
    configs: new ConfigService(manager),
    siteSettings: new SiteSettingsService(manager, files),
    requestLogs,
    files,
    menus: new MenuService(new MenuRepository(db)),
    visits,
    dashboard: new DashboardService(visits, requestLogs),
  }, db);
  const server = app.listen(0);
  try {
    const publicBase = `http://127.0.0.1:${server.address().port}/api/v1`;
    const base = `${publicBase}/admin`;
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
    const visit = { visitorId: '7a9e4c72-b061-4ee6-9ed8-d986dbd6c919', path: '/', pageTitle: '首页' };
    let visitResponse = await fetch(`${publicBase}/visits`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(visit) });
    assert.equal((await visitResponse.json()).data.recorded, true);
    visitResponse = await fetch(`${publicBase}/visits`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(visit) });
    assert.equal((await visitResponse.json()).data.recorded, false);
    result = await request('/dashboard', 'GET', undefined, token);
    assert.equal(result.body.data.visits.today, 1);
    result = await request('/home', 'GET', undefined, token);
    assert.equal(result.body.data.visits.today, 1);
    assert.equal(result.body.data.users.source, 'mock');
    assert.equal(result.body.data.users.total, 2680);
    assert.equal(result.body.data.users.trend7.length, 7);
    result = await request('/visits?path=%2F&page=1&pageSize=10', 'GET', undefined, token);
    assert.equal(result.body.data.total, 1);
    assert.equal(result.body.data.items[0].visitorId, visit.visitorId);
    systemConfig.update({ requestLogMode: 'all', consoleLogEnabled: false, consoleLogFormat: '[${time}] ${url}' });
    systemConfig.update({ requestLogMode: 'off', consoleLogEnabled: false, consoleLogFormat: '[${time}] ${url}' });
    const insertLog = db.prepare('INSERT INTO request_log (time, method, path, url, status, duration_ms) VALUES (?, ?, ?, ?, ?, ?)');
    const selectedId = Number(insertLog.run('2026-01-01T00:00:00.000Z', 'GET', '/api/v1/demo', '/api/v1/demo', 200, 1).lastInsertRowid);
    insertLog.run('2026-02-01T00:00:00.000Z', 'GET', '/api/v1/demo', '/api/v1/demo', 200, 1);
    result = await request('/request-logs', 'DELETE', { mode: 'ids', ids: [selectedId] });
    assert.equal(result.body.code, 1005);
    result = await request('/request-logs', 'DELETE', { mode: 'ids', ids: [selectedId] }, token);
    assert.equal(result.body.data.deleted, 1);
    result = await request('/request-logs', 'DELETE', {
      mode: 'timeRange', startTime: '2026-02-01T08:00:00+08:00', endTime: '2026-02-01T08:00:01+08:00',
    }, token);
    assert.equal(result.body.data.deleted, 1);
    for (const second of ['00', '01', '02']) {
      insertLog.run(`2026-03-01T00:00:${second}.000Z`, 'GET', '/api/v1/demo', '/api/v1/demo', 200, 1);
    }
    result = await request('/request-logs', 'DELETE', { mode: 'beforeTime', time: '2026-03-01T00:00:01.000Z' }, token);
    assert.equal(result.body.data.deleted, 1);
    result = await request('/request-logs', 'DELETE', { mode: 'afterTime', time: '2026-03-01T00:00:01.000Z' }, token);
    assert.equal(result.body.data.deleted, 1);
    insertLog.run('2026-03-01T00:00:03.000Z', 'GET', '/api/v1/demo', '/api/v1/demo', 200, 1);
    const newestId = Number(insertLog.run('2026-03-01T00:00:04.000Z', 'GET', '/api/v1/demo', '/api/v1/demo', 200, 1).lastInsertRowid);
    result = await request('/request-logs', 'DELETE', { mode: 'keepLatest', count: 1 }, token);
    assert.equal(result.body.data.deleted, 2);
    result = await request('/request-logs', 'GET', undefined, token);
    assert.equal(result.body.data.total, 1);
    assert.equal(result.body.data.items[0].id, newestId);
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
