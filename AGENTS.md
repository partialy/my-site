# 项目约定

本仓库是可复制的项目基础框架。`server/` 放通用后端，`admin/` 放管理端，`client/` 留给具体项目开发；根目录统一使用一个 Git 仓库。

## server 模块

- server 使用 Express 5、TypeScript、Zod、JWT 和 SQLite。仅管理端使用的接口统一使用 `/api/v1/admin/**` 并放入 `server/src/api/admin/`；admin/client 共用接口使用 `/api/v1/**`，放入公共路由模块。响应结构为 `{code, msg, data, success}`。
- 框架数据库维护单管理员 `admin`、普通动态配置 `config`、系统配置 `sys_config` 和每日去重的 `visit`；请求日志开启后按需创建 `request_log`。首次 setup 接口在同一事务内创建管理员并写入项目名称、后台/前台站点名称，不预设账号；端口、JWT_SECRET、SETUP_KEY 仍在启动前由 `.env` 配置。setup 不删除已有数据库或上传文件，仓库也不跟踪这些数据。
- `ConfigManager` 启动时加载配置并保持内存缓存；普通配置通过 `get(key, defaultValue)` 读取，系统配置通过 `getSysConfig().get(key)` 读取，写入时同步更新数据库和缓存。`config.enabled` 控制普通配置是否生效，`sys_config` 没有启用字段。
- 普通配置的管理接口位于 `/api/v1/admin/configs`，支持列表、新增、更新（含键改名）、删除。管理页以文本值编辑；服务端通过 `ConfigManager` 写库并立即刷新缓存。配置内容不写入请求日志。
- 请求日志中间件独立于认证：SQLite 记录模式为 `off`、`all`、`white_list`，默认关闭；控制台输出默认开启。白名单规则存在 `sys_config`，只记录匹配路径。日志内容需对密码、密钥、Token 等敏感字段脱敏并限制长度。
- 请求日志查询通过鉴权接口 `GET /api/v1/admin/request-logs`，支持分页及方法、路径、状态码筛选；日志表未创建时返回空列表，查询不触发建表。`DELETE /api/v1/admin/request-logs` 支持按 ID 列表、时间段、某时间前/后或保留最新 N 条清理，返回删除条数；日志表未创建时返回 0。时间前/后是严格比较，最新按自增 ID 判定。日志中间件不将日志查询、清理和仪表盘接口自身写入 SQLite。管理端请求日志页支持跨分页多选和规则清理，均需确认。
- 文件库由 `file` 表保存元数据，原文件存于 `server/data/uploads/`；列表、上传、归档需管理员鉴权，稳定文件链接公开访问。归档后文件不再出现在选择器，但旧链接继续可用。管理端的文件选择弹窗支持单选、多选、预览和现场上传；站点图标从文件库选择。
- 菜单结构存于 `menu` 表，首次运行写入默认一级/二级菜单；启动时不删除或调整已有菜单。修改密码入口在账号下拉菜单。`MenuService` 启动后加载到内存，`GET /api/v1/admin/menus` 读缓存，`PUT /api/v1/admin/menus` 事务写库成功后刷新缓存。菜单配置只控制导航，不作为路由注册或权限控制。
- 站点设置保存在 `sys_config`：项目名称，以及后台与前台各自的网站标签名称、系统名称和图标元数据。公开 `GET /api/v1/site-settings` 供未来 `client` 读取，管理端从 `/api/v1/admin/site-settings` 读取并经鉴权写入；图标入口使用文件选择弹窗，支持 PNG、JPEG、WebP、ICO，最大 2 MiB，不接收 SVG；旧版固定图标仍可读取。
- 前台访问通过公开 `POST /api/v1/visits` 上报；浏览器工具在 `client/visitTracker.ts` 保存访客 UUID 和最近上报的 UTC 日期，服务端以 `(visitor_id, visit_day)` 唯一约束兜底。每日仅记录首次访问的页面，属于尽力去重；清除存储后会生成新访客 ID。`GET /api/v1/admin/visits` 提供分页筛选访问日志。`GET /api/v1/admin/home` 聚合真实访问记录与近 7 天请求日志；用户总数、近 7 日活跃用户及新增用户趋势暂由 `services/dashboard-demo-data.ts` 提供并标记 `source: 'mock'`，业务项目接入用户表后替换。日志关闭时接口来源和热门接口为空。
- 代码按 API/Controller 边界、Service 业务层、Repository 数据访问层分层；鉴权、校验和安全能力分别放在中间件或独立模块。业务项目自行扩展业务表和 API。
- 接口、环境变量与启动方式见 `server/README.md`；改动服务端接口时需同步管理端契约。

## admin 模块

- admin 使用 React 18、TypeScript、React Router v6、Ant Design v5，采用 Vite 构建独立 SPA。
- 只做单管理员后台通用流程：初始化向导（`/setup`，项目/站点名称与初始管理员一并配置）、登录（`/login`）、自适应管理端布局、首页仪表盘、系统管理（`/system-config`）、配置管理（`/configs`）、请求日志（`/request-logs`）、访问日志（`/visit-logs`）、文件管理（`/files`）、修改密码、退出登录和 404 兜底页。业务菜单与页面留给复制后的项目添加。
- 初始菜单中「首页」为独立一级菜单；系统管理、配置管理、请求日志、文件管理和菜单管理归入「系统设置」分组。访问日志页面已注册，菜单由管理员在后台自行配置，建议路径 `/visit-logs`。修改密码从右上角账号菜单进入。
- 菜单管理页（`/menus`）支持页面、分组两类新菜单，明确选择「一级菜单」或所属分组、通过可搜索、分类展示的弹出式图标面板选择预置 Lucide 图标及调整同级排序；侧栏与管理页共用菜单状态，保存后立即更新。旧版操作菜单只作兼容展示，可删除，不再提供新增或编辑入口。图标键在 `menus/menuUtils.tsx` 统一映射，分类在 `menus/menuIconCategories.ts` 维护，未分类的新图标自动进入「其他」，已有键需保持兼容。隐藏或删除菜单管理入口后仍可直接访问 `/menus` 恢复。
- 已开发页面信息集中在 `src/router/pageRegistry.ts`，包含路径、名称、默认菜单标识和图标、是否属于初始菜单及是否可用于菜单；登录、初始化和 404 页面也要登记，但不可选作菜单。新增页面时同时在 `src/router/routes.tsx` 注册路由并在页面清单登记；随后由管理员在菜单管理中选择页面并手动保存菜单。页面选择器标明已添加和未添加状态，选中页面时只自动补齐空白的菜单标识、名称与图标。页面清单不入库，也不自动创建菜单。
- 管理端表格按内容宽度决定是否横向滚动；容器能完整显示所有列时不应出现横向滚动条。
- 管理端主题将 Input、Select、Button 的默认控件高度统一为 40px，筛选栏不要再单独混用不同高度。
- 代码按页面（`pages`）、布局（`layouts`）、复用组件（`components`）、API 请求（`api`）、认证状态（`auth`）与路由守卫（`router`）分层。
- 认证状态集中在 `src/auth/` 独立管理，Token 存放于 `sessionStorage`；页面与组件不直接发原始 fetch 请求或拼接 Authorization 头。
- 严格遵循管理端 `/api/v1/admin` 基础路径和 `{code, msg, data, success}` 契约。服务端 JSON 先按 `unknown` 处理并在请求层收窄，不使用 `any`。
- 管理端只访问真实 server：开发环境由 Vite 仅将 `/api/v1` 代理到 `SERVER_PROXY_TARGET`，不能使用 `/api` 代理前缀，否则会拦截 `/api-docs` 页面刷新；生产环境由网关配置同路径代理并将非接口页面路径回退到 `index.html`。没有预设管理员或本地模拟接口。
- `SiteSettingsProvider` 集中获取公开站点信息并同步后台浏览器标题、标签图标；登录页、初始化页和侧栏读取后台系统名称与图标。系统管理页用独立区块并排编辑后台、前台站点信息，内容页最大宽度统一为 1400px。
- 首页仪表盘从 `/api/v1/admin/home` 获取数据：访问统计、接口来源与热门接口来自真实访问记录和请求日志；近 7 日活跃用户、用户总数及新增用户趋势由服务端返回演示数据，并在界面标明，接入业务用户表后替换。管理端时间展示统一通过 `utils/dateTime.ts` 转换为本地 `YYYY-MM-DD HH:mm:ss`。
- 接口文档页位于 `/api-docs`，由 `pages/api-docs/apiCatalog.ts` 维护现有接口的端、模块、鉴权、参数与返回数据，`apiExamples.ts` 维护可复制的请求与成功响应 JSON 示例；二进制接口单独标注。页面支持分类筛选和搜索。新增或修改服务端接口时同步维护目录与示例；页面已注册路由与页面清单，侧栏菜单仍由管理员手动配置。


## Git 提交消息

提交消息使用中文，格式为：`【模块】【功能】细节描述`。

- 模块使用 `server`、`admin`、`client`、`文档` 等实际修改范围。
- 功能使用 `登录`、`初始化`、`配置` 等简短名称。
- 细节描述写清本次完成的具体内容，避免只写“修改”或“更新”。
- 一次提交跨多个模块时，模块可写 `全局`，或按主要改动选择模块。

示例：`【server】【登录】完成 JWT 生成与签发`。
