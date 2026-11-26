import fs from 'node:fs';
import path from 'node:path';
import {
  RELEASE_ROOT,
  copyPath,
  ensureModuleReady,
  prepareReleaseTarget,
  runCommand,
} from './release-utils.mjs';

const NATIVE_RELEASE_DIR = path.join(RELEASE_ROOT, 'native');

/**
 * 定位 Next.js standalone 产出目录（兼容直接平铺与多级工作区嵌套结构）。
 */
function resolveStandaloneRoot(clientDir) {
  const standaloneDir = path.join(clientDir, '.next', 'standalone');
  if (!fs.existsSync(standaloneDir)) {
    throw new Error(`未找到 Next.js standalone 构建产物: ${standaloneDir}`);
  }
  if (fs.existsSync(path.join(standaloneDir, 'server.js'))) {
    return standaloneDir;
  }
  const nestedClientDir = path.join(standaloneDir, 'client');
  if (fs.existsSync(path.join(nestedClientDir, 'server.js'))) {
    return nestedClientDir;
  }
  throw new Error(`未在 ${standaloneDir} 中找到 server.js，请确认 client/next.config.ts 已开启 output: "standalone"`);
}

/**
 * 生成原生部署包根 package.json（基于 server/package.json，保留依赖供 npm ci --omit=dev）。
 */
function writeReleasePackageJson(serverDir) {
  const serverPkgPath = path.join(serverDir, 'package.json');
  const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));

  const releasePkg = {
    ...serverPkg,
    scripts: {
      start: 'node dist/index.js',
      'start:web': 'node web/server.js',
    },
  };

  fs.writeFileSync(
    path.join(NATIVE_RELEASE_DIR, 'package.json'),
    `${JSON.stringify(releasePkg, null, 2)}\n`,
    'utf8',
  );

  const lockFile = path.join(serverDir, 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    fs.copyFileSync(lockFile, path.join(NATIVE_RELEASE_DIR, 'package-lock.json'));
  }
}

/**
 * 生成原生部署 Nginx 配置片段（用户端 web 与管理端 web-admin 处于不同域名，按需复制到各自 server {} 块内）。
 */
function writeNginxSnippet() {
  const content = `# ==============================================================================
# MySite 原生部署 Nginx 配置片段（用户端 web 与管理端 web-admin 独立域名）
# 按需将对应片段复制到各自域名 server {} 块中，并替换 /path/to/release/native 为实际部署路径。
# 默认后端端口约定：server -> 3000，web (Next.js standalone) -> 3001
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. 用户端站点（放入用户端域名 server {} 块内）
# ------------------------------------------------------------------------------
client_max_body_size 20m;

location ^~ /api/v1/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /health {
    proxy_pass http://127.0.0.1:3000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

# Next.js 构建哈希静态资源由 Nginx 直接托管
location ^~ /_next/static/ {
    alias /path/to/release/native/web/.next/static/;
    access_log off;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}


# ------------------------------------------------------------------------------
# 2. 管理端站点（放入管理端域名 server {} 块内）
# 注意：使用 /api/v1/ 前缀，切勿写成无斜杠的 /api，否则会误拦截前端路由 /api-docs。
# ------------------------------------------------------------------------------
root /path/to/release/native/web-admin;
index index.html;
client_max_body_size 20m;

location ^~ /api/v1/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /health {
    proxy_pass http://127.0.0.1:3000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location ~* \\.(?:js|css|png|jpe?g|gif|ico|svg|webp|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    try_files $uri =404;
}

location / {
    try_files $uri $uri/ /index.html;
}
`;

  fs.writeFileSync(path.join(NATIVE_RELEASE_DIR, 'nginx.conf'), content, 'utf8');
}

function main() {
  console.log('==> [1/5] 检查各模块依赖...');
  const serverDir = ensureModuleReady('server');
  const adminDir = ensureModuleReady('admin');
  const clientDir = ensureModuleReady('client');

  console.log('\n==> [2/5] 打包 server...');
  runCommand('npm', ['run', 'build'], serverDir);

  console.log('\n==> [3/5] 打包 admin...');
  runCommand('npm', ['run', 'build'], adminDir);

  console.log('\n==> [4/5] 打包 client (Next.js standalone)...');
  runCommand('npm', ['run', 'build'], clientDir, {
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  });

  console.log('\n==> [5/5] 组装输出到 release/native/...');
  prepareReleaseTarget(NATIVE_RELEASE_DIR);

  // 1. Server 产物平铺到 release/native/
  copyPath(path.join(serverDir, 'dist'), path.join(NATIVE_RELEASE_DIR, 'dist'));
  copyPath(path.join(serverDir, 'migrations'), path.join(NATIVE_RELEASE_DIR, 'migrations'));
  copyPath(path.join(serverDir, 'api-docs'), path.join(NATIVE_RELEASE_DIR, 'api-docs'));
  fs.copyFileSync(path.join(serverDir, '.env.example'), path.join(NATIVE_RELEASE_DIR, '.env.example'));
  writeReleasePackageJson(serverDir);

  // 2. Admin 静态产物 -> release/native/web-admin/
  copyPath(path.join(adminDir, 'dist'), path.join(NATIVE_RELEASE_DIR, 'web-admin'));

  // 3. Client standalone 产物 -> release/native/web/
  const standaloneRoot = resolveStandaloneRoot(clientDir);
  const webReleaseDir = path.join(NATIVE_RELEASE_DIR, 'web');
  copyPath(standaloneRoot, webReleaseDir);
  copyPath(path.join(clientDir, '.next', 'static'), path.join(webReleaseDir, '.next', 'static'));
  copyPath(path.join(clientDir, 'public'), path.join(webReleaseDir, 'public'));
  if (fs.existsSync(path.join(clientDir, 'fonts'))) {
    copyPath(path.join(clientDir, 'fonts'), path.join(webReleaseDir, 'fonts'));
  }
  if (fs.existsSync(path.join(clientDir, '.env.example'))) {
    fs.copyFileSync(path.join(clientDir, '.env.example'), path.join(webReleaseDir, '.env.example'));
  }

  // 4. 生成 Nginx 配置片段
  writeNginxSnippet();

  console.log('\n打包完成！产物目录: release/native/');
  console.log('  - release/native/            server 运行产物 (dist/, migrations/, api-docs/, package.json, .env.example)');
  console.log('  - release/native/web/        client Next.js standalone 产物 (server.js, .next/static/, public/)');
  console.log('  - release/native/web-admin/  admin 静态产物 (index.html, assets/)');
  console.log('  - release/native/nginx.conf  Nginx 配置片段');
  console.log('\n部署提示：在目标服务器进入 release/native/ 执行 npm ci --omit=dev 后，运行 npm start 启动 server，运行 PORT=3001 HOSTNAME=0.0.0.0 npm run start:web 启动前台。');
}

try {
  main();
} catch (error) {
  console.error('\n[build:all 失败]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
