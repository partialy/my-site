# admin 模块约定

> 本文件维护 `admin/` 模块的开发规范与实现边界；全局跨模块契约（响应结构、分页标准、UUID 规范、文档同步要求及 Git 提交规范）见根目录 [AGENTS.md](../AGENTS.md)。

## 技术栈与分层

- admin 使用 React 18、TypeScript、React Router v6、Ant Design v5，采用 Vite 构建独立 SPA。
- 代码按页面（`src/pages/`）、布局（`src/layouts/`）、复用组件（`src/components/`）、API 请求（`src/api/`）、认证状态（`src/auth/`）、路由与页面清单（`src/router/`）、通用 Hook（`src/hooks/`）分层。
- 认证状态集中在 `src/auth/` 独立管理，Token 存放于 `sessionStorage`；页面与组件不得直接发起原始 `fetch` 请求或手动拼接 `Authorization` 头。
- 严格遵循管理端 `/api/v1/admin` 基础路径与 `{ code, msg, data, success }` 契约。服务端返回的 JSON 先按 `unknown` 处理并在请求层收窄，严禁使用 `any`。
- 管理端只对接真实 `server/`：开发环境由 Vite 仅将 `/api/v1` 代理到 `SERVER_PROXY_TARGET`，**不能使用 `/api` 代理前缀**（否则会拦截 `/api-docs` 页面刷新）；生产环境由网关配置同路径代理并将非接口页面路径回退到 `index.html`。不内置预设管理员或本地模拟接口。

## 页面范围与路由/菜单注册

- 仅包含单管理员后台通用流程：初始化向导（`/setup`）、登录（`/login`）、首页仪表盘、系统管理（`/system-config`）、外观设置（`/appearance`）、配置管理（`/configs`）、数据字典（`/dictionaries`）、上传设置（`/upload-settings`）、请求日志（`/request-logs`）、操作日志（`/operation-logs`）、访问日志（`/visit-logs`）、文件管理（`/files`）、菜单管理（`/menus`）、接口文档（`/api-docs`）、修改密码、退出登录和 404 兜底页；并扩展个人主页业务模块：**作品管理（`/works`）**与**主页配置（`/profile-settings`）**（均已在 `pageRegistry.ts` 登记，需在 `/menus` 手动加入导航）。
- **页面登记**：已开发页面信息集中在 [src/router/pageRegistry.ts](src/router/pageRegistry.ts)，包含路径、名称、默认菜单标识与图标、是否属于初始菜单及是否可用于菜单；登录、初始化和 404 页面也需登记且设为不可选作菜单。新增页面时必须同时在 [src/router/routes.tsx](src/router/routes.tsx) 注册路由并在页面清单登记，随后由管理员在菜单管理页手动选用保存（页面清单不入库，也不自动创建菜单）。
- **菜单管理（`/menus`）**：支持页面、分组两类菜单及调整同级排序，与侧栏共用菜单状态并即时更新；旧版操作菜单仅做兼容展示可删除，不再提供新增/编辑入口。图标键在 `src/menus/menuUtils.tsx` 统一映射，分类在 `src/menus/menuIconCategories.ts` 维护（未分类自动归入「其他」，已有键保持兼容）。隐藏或删除菜单管理入口后仍可直接访问 `/menus` 恢复。修改密码入口位于右上角账号下拉菜单。

## 列表、分页与通用组件

- **表格分页与 URL 状态**：`src/hooks/useTableQuery.ts` 统一管理列表 URL 查询状态、分页、防过期响应和刷新。浏览器 URL 保持 `page` / `pageSize` 展示页码，发请求前由 Hook 内部自动换算为 `offset` / `limit`；列表 API 模块统一复用 `src/api/types.ts`（`PageQuery`、`PageData<T>`）与 `src/api/decoders.ts`（`buildPageParams`、`parsePageData`）。
- **CRUD 组件**：`src/components/crud/` 提供防抖筛选栏（`CrudFilterBar`）与带二次确认、防重复点击的操作列按钮（`CrudRowActions`）。操作日志、访问日志、请求日志和文件管理页已接入；新增普通业务页只需声明筛选字段、列和 API 契约，专有写操作保留在业务 Hook/Service。
- **文件选择弹窗**：`FilePickerModal` 使用局部列表状态（`useFileLibrary.ts` 内部换算 `offset` / `limit`），只读取可用文件（`status=active`），支持单选、多选、预览和现场上传，避免弹窗筛选占用页面 URL。文件管理页支持点击大小、上传时间表头排序并写入 URL，排序字段仅使用 `createdAt` / `size` 与 `asc` / `desc` 白名单。
- **UI 与样式约定**：
  - 内容页最大宽度统一为 `1400px`。
  - 表格按内容宽度决定是否横向滚动（`scroll={{ x: 'max-content' }}`），容器能完整显示所有列时不应出现横向滚动条。
  - 主题已将 `Input`、`Select`、`Button` 默认控件高度统一为 `40px`，筛选栏不要再单独混用不同高度。
  - 时间展示统一通过 `src/utils/dateTime.ts` 转换为本地 `YYYY-MM-DD HH:mm:ss`。

## 专项能力与在线接口文档同步

- **站点外观**：`SiteSettingsProvider` 集中获取公开站点信息并同步浏览器标题和标签图标；`/appearance` 并排编辑后台与前台站点信息，并单独保存登录外观。
- **数据字典**：`src/dictionaries/` 提供 `DictSelect`、`DictTag` 与共享请求缓存；`/dictionaries` 支持动态多组新增、单条编辑及 TypeScript/Java 代码导出（含停用子项以保留历史值）。
- **上传能力**：`src/api/uploadFile.ts` 为管理端独立浏览器上传入口（不跨目录导入 `client/`）。
- **白名单与在线接口文档（`/api-docs`）**：
  - `src/pages/api-docs/ApiDocsPage.tsx` 通过 `GET /api/v1/admin/api-docs*` 动态读取并渲染 `server/api-docs/` 的目录树与 Markdown 文档（使用 `react-markdown` + `remark-gfm`），支持按端筛选、全文搜索与导出完整 Markdown 文档。
  - `src/pages/system-config/requestLogEndpoints.ts` 通过 `loadRequestLogEndpoints()` 动态复用同一份服务端接口目录，并排除动态路径及不写入日志的接口。
  - 新增或修改服务端接口时只需维护 `server/api-docs/`；若接口属于不写入日志的管理/运维接口，需同步核对 `requestLogEndpoints.ts` 的 `excludedPaths`。
