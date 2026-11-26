# 项目约定（全局）

本仓库是可复制的项目基础框架。`server/` 放通用后端，`admin/` 放管理端，`client/` 留给具体业务前台开发；根目录统一使用一个 Git 仓库。

## 规则维护与同步要求

- 涉及更改架构、调整模块职责、改变目录结构、修改跨端契约或新增/变更关键开发规范时，**必须同步更新**本文件及对应模块的 `AGENTS.md`（例如分页规则调整、目录拆分或通用组件替换时，文档须与代码同步更新）。
- 当发现已有说明、注释或文档与代码实际行为不一致时，应优先修正不一致内容。
- 新增、修改或删除服务端接口时，**必须同步更新** `server/api-docs/`（`index.md` 与对应模块接口文档）；管理端在线接口文档与白名单接口选择器直接读取服务端文档目录，无需双份维护。

## 模块规则索引

各模块细则由对应目录下的 `AGENTS.md` 独立维护，开发对应模块前先查阅：

- 服务端模块规范：[server/AGENTS.md](server/AGENTS.md)（接口文档见 [server/api-docs/index.md](server/api-docs/index.md)）
- 管理端模块规范：[admin/AGENTS.md](admin/AGENTS.md)
- 前台客户端规范：[client/AGENTS.md](client/AGENTS.md)

## 统一打包与发布目录

根目录产物统一输出至 `release/`（该目录已加入 `.gitignore`），按部署方式拆分为 `release/native/` 与 `release/docker/` 两个同级目录：

- **原生部署包（`npm run build:all`，[scripts/build-all.mjs](scripts/build-all.mjs)）**：依次打包 `server`、`admin`、`client` 并输出至 `release/native/`。
  - `release/native/` 根目录平铺 `server` 运行产物（`dist/`、`migrations/`、`api-docs/`、`package.json`、`package-lock.json`、`.env.example`，其中 `scripts.start` 启动 `server`，`scripts.start:web` 启动 `web`），不包含 `node_modules`（目标环境需执行 `npm ci --omit=dev`）。
  - 同级包含 `release/native/web/`（`client` 的 Next.js `standalone` 产物，含 `.next/static`、`public` 与 `fonts`）、`release/native/web-admin/`（`admin` 静态构建产物）以及 `release/native/nginx.conf`。
- **Docker 部署包（`npm run build:docker`，[scripts/build-docker.mjs](scripts/build-docker.mjs)）**：打包 `admin` 静态产物并整理 `server`/`client` 镜像构建上下文，输出至 `release/docker/`。
  - `release/docker/server/` 与 `release/docker/client/` 包含各自源码、`Dockerfile` 与 `.dockerignore`（供服务器 `docker compose up -d --build` 编译 Linux 镜像）；`release/docker/web-admin/` 存放 `admin` 静态文件由宿主机 Nginx 托管。
  - 同级包含 `release/docker/docker-compose.yml`（仅编排 `server` 与 `client` 容器，端口绑定 `127.0.0.1` 并挂载 `./data:/app/data`）、`.env.example`、`nginx.conf` 与 `DEPLOY.md`。
- **GitHub Actions 自动镜像构建**：[.github/workflows/docker-server.yml](.github/workflows/docker-server.yml) 与 [.github/workflows/docker-client.yml](.github/workflows/docker-client.yml) 分别监听 `main` 分支下 `server/**` 与 `client/**` 变更（使用 GitHub Environment `build`），构建 `linux/amd64` 镜像并以 `server-latest` / `server-<sha>`、`client-latest` / `client-<sha>` 推送至阿里云 ACR 单仓库；服务器拉取部署模板见 [deploy/docker-compose.acr.yml](deploy/docker-compose.acr.yml)。

## 全局跨模块契约

### 接口前缀与响应结构

- 仅管理端使用的接口统一使用 `/api/v1/admin/**` 前缀；admin/client 共用或公开接口使用 `/api/v1/**` 前缀（`/health` 健康探针除外）。
- 所有 JSON 接口统一返回 `{ code, msg, data, success }`（成功时 `code = 0`、`success = true`；参数校验失败 `code = 1001` 且 `data = { fieldErrors }`；其余失败 `success = false`、`data = null`）。

### 分页统一标准

- 所有分页接口请求参数统一使用 `offset`（默认 `0`，`>= 0` 整数）与 `limit`（默认 `20`，`1–100` 整数），不兼容 `page` / `pageSize`。
- 所有分页接口响应 `data` 结构统一为 `{ list, total, offset, limit, hasMore }`，其中 `hasMore` 按 `offset + list.length < total` 计算。
- 配置、菜单、字典、白名单等非增长式配置类列表保持全量数组返回，不分页；持续增长型数据列表均须按此分页标准实现。

### 对外资源标识（UUID）

- 对外可按单条资源定位、修改或删除的业务表，应独立设置 `uuid` 唯一字段，采用 UUID v4 去除连字符后的 32 位小写十六进制字符串（`file.id` 已对外使用的带连字符 UUID 保持原格式及历史链接不变）。
- 对外 API 列表/详情、路径参数、批量指定记录及用户 JWT 主体统一使用 `uuid`，不向外暴露数据库自增主键；自增 `id` 与整数外键仅留作库内关联、排序和聚合。

## Git 提交消息

提交消息使用中文，格式为：`【模块】【功能】细节描述`。

- 模块使用 `server`、`admin`、`client`、`文档` 等实际修改范围。
- 功能使用 `登录`、`初始化`、`配置`、`分页` 等简短名称。
- 细节描述写清本次完成的具体内容，避免只写“修改”或“更新”。
- 一次提交跨多个模块时，模块可写 `全局`，或按主要改动选择模块。

示例：`【server】【登录】完成 JWT 生成与签发`。
