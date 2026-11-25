import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');

/**
 * 在指定子项目目录下执行命令并检查退出码。
 */
function runCommand(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });

  if (result.error) {
    throw new Error(`执行命令失败 (${cwd}): ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`命令退出码异常 (${result.status}): ${command} ${args.join(' ')}`);
  }
}

/**
 * 校验各模块目录及依赖是否就绪。
 */
function ensureModuleReady(moduleName) {
  const moduleDir = path.join(ROOT_DIR, moduleName);
  const pkgPath = path.join(moduleDir, 'package.json');
  const nodeModulesPath = path.join(moduleDir, 'node_modules');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`未找到模块配置: ${pkgPath}`);
  }
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error(`模块 ${moduleName} 尚未安装依赖，请先在 ${moduleName}/ 下执行 npm ci 或 npm install`);
  }
  return moduleDir;
}

/**
 * 清理 release 目录，保留运行时数据目录（data/）与本地环境文件（.env）。
 */
function prepareReleaseDir() {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const preservedNames = new Set(['data', '.env']);

  for (const entry of fs.readdirSync(RELEASE_DIR)) {
    if (preservedNames.has(entry)) continue;
    fs.rmSync(path.join(RELEASE_DIR, entry), { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(RELEASE_DIR, 'data'), { recursive: true });
}

/**
 * 递归复制目录或文件，确保目标目录干净创建。
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`待复制源路径不存在: ${src}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

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
 * 生成释放包根 package.json（基于 server/package.json，保留依赖供 npm ci --omit=dev）。
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
    path.join(RELEASE_DIR, 'package.json'),
    `${JSON.stringify(releasePkg, null, 2)}\n`,
    'utf8',
  );

  const lockFile = path.join(serverDir, 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    fs.copyFileSync(lockFile, path.join(RELEASE_DIR, 'package-lock.json'));
  }
}

/**
 * 生成 Nginx 配置片段（用户端 web 与管理端 web-admin 处于不同域名，按需复制到各自 server {} 块内）。
 */
function writeNginxSnippet() {
  const content = `# ==============================================================================
# MySite Nginx 配置片段（用户端 web 与管理端 web-admin 独立域名）
# 按需将对应片段复制到各自域名 server {} 块中，并替换 /path/to/release 为实际部署路径。
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
    alias /path/to/release/web/.next/static/;
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
root /path/to/release/web-admin;
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

  fs.writeFileSync(path.join(RELEASE_DIR, 'nginx.conf'), content, 'utf8');
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

  console.log('\n==> [5/5] 组装输出到 release/...');
  prepareReleaseDir();

  // 1. Server 产物平铺到 release/
  copyDir(path.join(serverDir, 'dist'), path.join(RELEASE_DIR, 'dist'));
  copyDir(path.join(serverDir, 'migrations'), path.join(RELEASE_DIR, 'migrations'));
  copyDir(path.join(serverDir, 'api-docs'), path.join(RELEASE_DIR, 'api-docs'));
  fs.copyFileSync(path.join(serverDir, '.env.example'), path.join(RELEASE_DIR, '.env.example'));
  writeReleasePackageJson(serverDir);

  // 2. Admin 静态产物 -> release/web-admin/
  copyDir(path.join(adminDir, 'dist'), path.join(RELEASE_DIR, 'web-admin'));

  // 3. Client standalone 产物 -> release/web/
  const standaloneRoot = resolveStandaloneRoot(clientDir);
  const webReleaseDir = path.join(RELEASE_DIR, 'web');
  copyDir(standaloneRoot, webReleaseDir);
  copyDir(path.join(clientDir, '.next', 'static'), path.join(webReleaseDir, '.next', 'static'));
  copyDir(path.join(clientDir, 'public'), path.join(webReleaseDir, 'public'));
  if (fs.existsSync(path.join(clientDir, 'fonts'))) {
    copyDir(path.join(clientDir, 'fonts'), path.join(webReleaseDir, 'fonts'));
  }
  if (fs.existsSync(path.join(clientDir, '.env.example'))) {
    fs.copyFileSync(path.join(clientDir, '.env.example'), path.join(webReleaseDir, '.env.example'));
  }

  // 4. 生成 Nginx 配置片段
  writeNginxSnippet();

  console.log('\n打包完成！产物目录: release/');
  console.log('  - release/            server 运行产物 (dist/, migrations/, api-docs/, package.json, .env.example)');
  console.log('  - release/web/        client Next.js standalone 产物 (server.js, .next/static/, public/)');
  console.log('  - release/web-admin/  admin 静态产物 (index.html, assets/)');
  console.log('  - release/nginx.conf  Nginx 配置片段');
  console.log('\n部署提示：在目标服务器进入 release/ 执行 npm ci --omit=dev 后，运行 npm start 启动 server，运行 PORT=3001 HOSTNAME=0.0.0.0 npm run start:web 启动前台。');
}

try {
  main();
} catch (error) {
  console.error('\n[build:all 失败]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
