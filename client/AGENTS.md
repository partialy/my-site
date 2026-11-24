# client 模块约定

> 本文件维护 `client/` 模块规范；全局跨模块契约（响应结构、分页标准、UUID 规范、文档同步要求及 Git 提交规范）见根目录 [AGENTS.md](../AGENTS.md)。

## 模块定位与技术栈

- `client/` 为面向访客的个人主页与作品展示前台，采用 **Next.js（App Router）+ TypeScript + Tailwind CSS v4 + Motion** 构建，纯前端通过独立 Service 层对接 `server/` 公开接口（`/api/v1/**`），不直接操作数据库。
- `client/` 与 `admin/` 保持独立：**禁止跨目录互相导入代码**，需要复用的逻辑各自在目录内维护独立副本。
- 开发与运行默认端口为 **`3001`**（避免与 `server/` 默认端口 `3000` 冲突），浏览器端请求默认通过 `next.config.ts` 的 `rewrites` 代理 `/api/v1/:path*` 与 `/health` 到 `SERVER_INTERNAL_URL`（默认 `http://127.0.0.1:3000`）。

## 目录结构

- `src/app/`：App Router 页面与 SEO 路由文件：
  - `/`（`page.tsx`）：全屏作品展厅（桌面 4 页 PPT + 左侧凸弧轮盘；移动端混合滚动 + 抽屉导航）
  - `/works`（`works/page.tsx`）：全部作品目录页（分类筛选 + 关键词搜索）
  - `/works/[slug]`（`works/[slug]/page.tsx`）：作品完整档案详情页（保留语义化 `slug` 利于 SEO，数据层同时维护 `uuid`）
  - `/about`（`about/page.tsx`）：关于作者与创作原则页
  - `robots.ts`、`sitemap.ts`、`opengraph-image.tsx`、`not-found.tsx`
- `src/services/`：按页面与业务域拆分的接口获取层（当前使用 `mockData.ts` 模拟返回，后续直接切换为 `requestApi()` 调用服务端）：
  - `siteService.ts`（站点基础配置与页脚备案）
  - `showcaseService.ts`（首页展厅数据与 `?work=slug` 定位）
  - `worksService.ts`（全部作品目录列表与分类）
  - `workDetailService.ts`（单作品详情、上下相邻作品与全量 slug 索引）
  - `aboutService.ts`（作者资料与原则列表）
- `src/components/`：按职责拆分的 UI 组件（`showcase/` 展厅与子页视觉组件、`icons/` 自定义 SVG 图标、`seo/` JSON-LD、`analytics/` 访问上报）。页面数据统一在服务端拉取后通过 Props 传入组件，不在 UI 组件内硬编码业务配置。
- `src/lib/api/`：服务端公开接口请求底包（`client.ts`、`types.ts`、`site.ts`、`uploadFile.ts`）。
- `src/lib/showcase/`：时钟轮盘几何逻辑（`archWheel.ts`）、移动端混合滚动判断（`mobileScroll.ts`）与搜索过滤（`searchWorks.ts`）。
- `src/lib/seo/`：SEO 站点默认配置与 Schema.org JSON-LD 生成器。
- `src/lib/analytics/`：访客每日去重上报工具 `visitTracker.ts`。

## SEO 与路由约定

- 所有公开页面均由服务端组件（RSC）输出首屏内容与语义化结构，每个路由具备独立 `metadata` / `generateMetadata` 与 `alternates.canonical`。
- 前台作品路由使用 `/works/[slug]`（保障 SEO 可读性）；后台管理接口与数据库仍统一使用 32 位无连字符 `uuid` 作为主键标识，公开详情接口需兼容按 `slug` 或 `uuid` 查询。
- 首页通过 `ItemList` JSON-LD 与 `sr-only` 作品链接索引确保搜索引擎收录；详情页输出 `SoftwareApplication` JSON-LD，并在 `sitemap.ts` 动态生成所有公开作品路由。

## 服务端接口对接约定

- 前台仅调用公开接口（`/api/v1/**`），禁止调用管理端 `/api/v1/admin/**` 接口。
- 统一通过 `src/lib/api/client.ts` 的 `requestApi()` 发起请求，自动区分 SSR（直连 `SERVER_INTERNAL_URL`）与浏览器端（同源 `/api/v1`）。
- 分页列表查询严格遵守根目录 `AGENTS.md` 中的 `{ code, msg, data, success }` 与纯 `offset / limit` 规范；可用接口以 [server/api-docs/index.md](../server/api-docs/index.md) 为准。
