import fs from 'node:fs';
import path from 'node:path';
import {
  RELEASE_ROOT,
  copyPath,
  ensureModuleReady,
  prepareReleaseTarget,
  runCommand,
} from './release-utils.mjs';

const DOCKER_RELEASE_DIR = path.join(RELEASE_ROOT, 'docker');

const SERVER_DOCKER_FILES = [
  'Dockerfile',
  '.dockerignore',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'src',
  'migrations',
  'api-docs',
];

const CLIENT_DOCKER_FILES = [
  'Dockerfile',
  '.dockerignore',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  'next-env.d.ts',
  'src',
  'public',
  'fonts',
];

/**
 * 复制指定模块的 Docker 构建源码清单到目标目录。
 */
function copyModuleSources(sourceDir, targetDir, fileList) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fileList) {
    const srcPath = path.join(sourceDir, entry);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`缺少 Docker 构建必需文件: ${srcPath}`);
    }
    copyPath(srcPath, path.join(targetDir, entry));
  }
}

/**
 * 生成仅包含 server 与 client（Next.js）服务的 docker-compose.yml（宿主机端口绑定 127.0.0.1）。
 */
function writeDockerCompose() {
  const content = `services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: mysite-server
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${SERVER_HOST_PORT:-56300}:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      SQLITE_PATH: /app/data/framework.sqlite
      JWT_SECRET: \${JWT_SECRET:?请在 .env 中设置不少于 32 位的 JWT_SECRET}
      SETUP_KEY: \${SETUP_KEY:?请在 .env 中设置不少于 16 位的 SETUP_KEY}
      ADMIN_ORIGIN: \${ADMIN_ORIGIN:-https://admin.example.com}
      TRUSTED_PROXIES: \${TRUSTED_PROXIES:-loopback,linklocal,uniquelocal}
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - mysite-net

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SITE_URL: \${NEXT_PUBLIC_SITE_URL:-http://localhost:56080}
        NEXT_PUBLIC_API_BASE_URL: /api/v1
    container_name: mysite-client
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${CLIENT_HOST_PORT:-56080}:80"
    environment:
      PORT: 80
      HOSTNAME: 0.0.0.0
      SERVER_INTERNAL_URL: http://server:3000
      NEXT_PUBLIC_SITE_URL: \${NEXT_PUBLIC_SITE_URL:-http://localhost:56080}
      NEXT_PUBLIC_API_BASE_URL: /api/v1
    depends_on:
      server:
        condition: service_healthy
    networks:
      - mysite-net

networks:
  mysite-net:
    driver: bridge
`;

  fs.writeFileSync(path.join(DOCKER_RELEASE_DIR, 'docker-compose.yml'), content, 'utf8');
}

/**
 * 生成 Docker Compose 环境变量模板。
 */
function writeDockerEnvExample() {
  const content = `# Docker 部署环境变量模板（复制为当前目录下 .env 后使用：cp .env.example .env）

# 宿主机本地监听端口（仅绑定 127.0.0.1，通过宿主机 Nginx 对外暴露）
SERVER_HOST_PORT=56300
CLIENT_HOST_PORT=56080

# 服务端安全密钥（生产环境务必替换，且不要以 replace-with- 开头）
JWT_SECRET=change-this-to-at-least-32-chars-jwt-secret
SETUP_KEY=change-this-setup-key-16chars

# 管理端访问来源（用于 CORS 校验，填写浏览器实际访问管理端的完整 Origin，不含末尾斜杠）
ADMIN_ORIGIN=https://admin.example.com

# 反代可信代理（容器反代与宿主机 Nginx 场景建议保留）
TRUSTED_PROXIES=loopback,linklocal,uniquelocal

# 用户端对外访问 URL（构建 client 镜像时注入，用于 SEO canonical、sitemap.xml 与 Open Graph）
NEXT_PUBLIC_SITE_URL=https://example.com
`;

  fs.writeFileSync(path.join(DOCKER_RELEASE_DIR, '.env.example'), content, 'utf8');
}

/**
 * 生成宿主机 Nginx 配置片段（重点提供 admin 静态托管与反代，并附带 web 反代片段）。
 */
function writeNginxSnippet() {
  const content = `# ==============================================================================
# MySite Docker 混合部署 Nginx 配置片段（用户端 web 与管理端 web-admin 独立域名）
# 按需将对应片段复制到宿主机 Nginx 对应域名 server {} 块中，并替换路径。
# 容器本地监听端口（仅绑定 127.0.0.1）：
#   - server -> 127.0.0.1:56300
#   - client -> 127.0.0.1:56080
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. 管理端站点（必选：静态文件由宿主机 Nginx 直接托管，放入管理端域名 server {} 块内）
# 注意：必须使用 /api/v1/ 前缀，切勿写成无斜杠的 /api，否则会误拦截前端路由 /api-docs。
# ------------------------------------------------------------------------------
root /path/to/release/docker/web-admin;
index index.html;
client_max_body_size 20m;

location ^~ /api/v1/ {
    proxy_pass http://127.0.0.1:56300;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /health {
    proxy_pass http://127.0.0.1:56300/health;
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


# ------------------------------------------------------------------------------
# 2. 用户端站点（参考：反代到 Docker 内的 Next.js client 容器，放入用户端域名 server {} 块内）
# ------------------------------------------------------------------------------
client_max_body_size 20m;

location ^~ /api/v1/ {
    proxy_pass http://127.0.0.1:56300;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /health {
    proxy_pass http://127.0.0.1:56300/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location / {
    proxy_pass http://127.0.0.1:56080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
`;

  fs.writeFileSync(path.join(DOCKER_RELEASE_DIR, 'nginx.conf'), content, 'utf8');
}

/**
 * 生成 Docker 部署说明文档。
 */
function writeDeployDoc() {
  const content = `# MySite Docker 部署说明

本目录由 \`npm run build:docker\` 自动生成，包含构建与运行 \`server\` + \`client\`（Next.js）容器所需的全部文件，以及由宿主机 Nginx 托管的 \`admin\` 静态产物。

## 目录结构

\`\`\`text
docker/
├── server/              # server 源码、migrations、api-docs 与 Dockerfile
├── client/              # client (Next.js) 源码、public、fonts 与 Dockerfile
├── web-admin/           # admin 静态构建产物（由宿主机 Nginx 直接托管）
├── data/                # server SQLite 数据库与上传文件持久化挂载目录
├── docker-compose.yml   # 仅编排 server 与 client 容器（端口绑定 127.0.0.1）
├── .env.example         # 环境变量模板
├── nginx.conf           # 宿主机 Nginx location 配置片段（admin 托管 + web 反代）
└── DEPLOY.md            # 本文档
\`\`\`

## 1. 上传与环境变量配置

将整个 \`docker/\` 目录上传至服务器（例如 \`/opt/mysite\`），进入目录并创建 \`.env\`：

\`\`\`bash
cd /opt/mysite
cp .env.example .env
vim .env
\`\`\`

重点修改以下配置项：

- \`JWT_SECRET\`：至少 32 位随机字符串（生产环境务必替换）。
- \`SETUP_KEY\`：至少 16 位随机字符串（用于首次初始化管理员及重置密码）。
- \`ADMIN_ORIGIN\`：管理端浏览器实际访问地址（例如 \`https://admin.example.com\`，不要带末尾 \`/\`）。
- \`NEXT_PUBLIC_SITE_URL\`：用户端对外访问地址（例如 \`https://example.com\`，构建 \`client\` 镜像时会注入 SEO 与站点链接）。
- \`SERVER_HOST_PORT\` / \`CLIENT_HOST_PORT\`：默认绑定 \`127.0.0.1:56300\` 与 \`127.0.0.1:56080\`，如端口冲突可修改。

## 2. 构建并启动容器

\`\`\`bash
docker compose up -d --build
\`\`\`

常用运维命令：

\`\`\`bash
# 查看运行状态与健康检查
docker compose ps

# 查看实时日志
docker compose logs -f server
docker compose logs -f client

# 停止并移除容器（data/ 数据卷保留在宿主机目录中）
docker compose down

# 仅更新代码后重新构建启动
docker compose up -d --build
\`\`\`

> 提示：若在 \`.env\` 中修改了 \`NEXT_PUBLIC_SITE_URL\`，需重新执行 \`docker compose build client && docker compose up -d\` 使其在静态元数据中生效。

## 3. 配置宿主机 Nginx

打开 [nginx.conf](./nginx.conf)：

1. 将 **「1. 管理端站点」** 片段复制到管理端域名 \`server {}\` 块内，并把 \`root\` 路径替换为服务器上的 \`/opt/mysite/web-admin\`。
2. 将 **「2. 用户端站点」** 片段复制到用户端域名 \`server {}\` 块内（若改动过 \`SERVER_HOST_PORT\` / \`CLIENT_HOST_PORT\`，同步调整 \`proxy_pass\` 端口）。
3. 校验并重载 Nginx：

\`\`\`bash
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

## 4. 首次初始化验证

1. 检查后端健康状态：\`curl http://127.0.0.1:56300/health\`（返回 \`{"status":"ok"}\`）。
2. 打开管理端域名完成首次管理员初始化（需填写 \`.env\` 中的 \`SETUP_KEY\`）。
3. 打开用户端域名确认前台页面与作品展示正常。
`;

  fs.writeFileSync(path.join(DOCKER_RELEASE_DIR, 'DEPLOY.md'), content, 'utf8');
}

function main() {
  console.log('==> [1/4] 检查各模块与文件...');
  const serverDir = ensureModuleReady('server', { requireDeps: false });
  const clientDir = ensureModuleReady('client', { requireDeps: false });
  const adminDir = ensureModuleReady('admin', { requireDeps: true });

  console.log('\n==> [2/4] 构建 admin 静态产物...');
  runCommand('npm', ['run', 'build'], adminDir);

  console.log('\n==> [3/4] 准备 release/docker/ 目录（保留已有 data/ 与 .env）...');
  prepareReleaseTarget(DOCKER_RELEASE_DIR);

  console.log('\n==> [4/4] 复制 Docker 构建上下文与部署文件...');
  copyModuleSources(serverDir, path.join(DOCKER_RELEASE_DIR, 'server'), SERVER_DOCKER_FILES);
  copyModuleSources(clientDir, path.join(DOCKER_RELEASE_DIR, 'client'), CLIENT_DOCKER_FILES);
  copyPath(path.join(adminDir, 'dist'), path.join(DOCKER_RELEASE_DIR, 'web-admin'));

  writeDockerCompose();
  writeDockerEnvExample();
  writeNginxSnippet();
  writeDeployDoc();

  console.log('\nDocker 部署包构建完成！产物目录: release/docker/');
  console.log('  - release/docker/server/             server 源码与 Dockerfile');
  console.log('  - release/docker/client/             client (Next.js) 源码与 Dockerfile');
  console.log('  - release/docker/web-admin/          admin 静态产物（宿主机 Nginx 托管）');
  console.log('  - release/docker/data/               SQLite 与上传文件持久化目录');
  console.log('  - release/docker/docker-compose.yml  容器编排文件');
  console.log('  - release/docker/.env.example        环境变量模板');
  console.log('  - release/docker/nginx.conf          宿主机 Nginx location 片段');
  console.log('  - release/docker/DEPLOY.md           部署说明文档');
  console.log('\n下一步：复制 release/docker/ 到服务器，配置 .env 与 Nginx 后执行 docker compose up -d --build。');
}

try {
  main();
} catch (error) {
  console.error('\n[build:docker 失败]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
