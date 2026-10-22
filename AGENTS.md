# 项目约定

本仓库是可复制的项目基础框架。`server/` 放通用后端，`admin/` 放管理端，`client/` 留给具体项目开发；根目录统一使用一个 Git 仓库。

## server 模块

- server 使用 Express 5、TypeScript、Zod、JWT 和 SQLite。仅管理端使用的接口统一使用 `/api/v1/admin/**` 并放入 `server/src/api/admin/`；admin/client 共用接口使用 `/api/v1/**`，放入公共路由模块。响应结构为 `{code, msg, data, success}`。
- 框架数据库维护单管理员 `admin`、普通动态配置 `config`、系统配置 `sys_config` 和每日去重的 `visit`；请求日志开启后按需创建 `request_log`。首次 setup 接口在同一事务内创建管理员并写入项目名称、后台/前台站点名称，不预设账号；端口、JWT_SECRET、SETUP_KEY 仍在启动前由 `.env` 配置。setup 不删除已有数据库或上传文件，仓库也不跟踪这些数据。
- `server/migrations/` 分 `sql/`、`dev-sql/`、`prod-sql/`：`sql/` 仅在新库首次启动时按文件名执行建表和初始数据，可在开发期直接维护最新结构；`prod-sql/` 在所有环境每次启动时扫描并执行未执行的升级脚本；`dev-sql/` 只在非生产环境自动执行，正式上线前可清理。新库将当前升级脚本记为基线，避免重复修改最新结构；已有库的每个升级脚本与执行记录同事务提交，已执行脚本内容变化会阻止启动，需新增后续脚本而非改旧脚本。迁移 SQL 由 `.gitattributes` 固定为 LF 换行，避免跨平台校验值不同。生产部署需在 `.env` 设置 `NODE_ENV=production`。管理员可下载 SQLite 在线备份，备份不包含 `server/data/uploads/` 与 `server/data/site-icons/`，临时备份文件下载后清理。
- 通用业务用户保存在 `user`，使用唯一账号及密码注册；用户 JWT 与管理员 JWT 区分，禁用用户会撤销已有用户 Token。`user_activity` 按 UTC 日记录已认证用户活动，首页用户统计从真实用户表聚合。`client/userAuth.ts` 提供框架无关的前台请求模板，Token 存储由业务项目决定。用户管理页路由 `/users`，菜单由管理员手动配置。
- `operation_log` 独立保存框架管理员成功写操作的摘要、操作者、目标、IP 和耗时；业务 Service 可显式调用 `OperationLogService.record()`。不保存密码、Token、原始请求体和响应体。管理端 `/operation-logs` 页面可按模块、操作人和时间查询，菜单由管理员手动配置。
- 登录失败按 IP 与账号组合限制，公开注册/访问上报和上传接口分别限流；限流器只适用于单进程部署。`TRUSTED_PROXIES` 只填写可信反向代理。`/health` 为公开就绪探针；管理员 `system-status` 提供缓存的运行状态。安全响应头由 Helmet 设置，公开图片允许跨域加载。
- `ConfigManager` 启动时加载配置并保持内存缓存；普通配置通过 `get(key, defaultValue)` 读取，系统配置通过 `getSysConfig().get(key)` 读取，写入时同步更新数据库和缓存。`config.enabled` 控制普通配置是否生效，`sys_config` 没有启用字段。
- 数据字典使用 `dict_type` 与 `dict_item` 管理可配置的展示选项。类型 `code` 与子项 `value` 创建后不可修改，已有选项通过停用保留历史值；核心业务状态流转仍由业务代码控制。字典服务启动时加载内存缓存，管理端写入成功后刷新；管理接口位于 `/api/v1/admin/dictionaries`，批量新增使用 `/batch` 或 `/:id/items/batch`，最多 20 条且整批事务提交；公共接口 `/api/v1/dictionaries` 仅返回公开且启用的类型与子项。管理端 `/dictionaries` 页面维护字典，新增使用动态多组表单，编辑为单条，左侧类型列表支持名称、标识、备注搜索与分页；可选择类型导出 TypeScript 常量或 Java 枚举，复制代码始终合并为单文件，下载可选单文件或多文件 ZIP，导出包含停用子项以保留历史值，显示名称仅作为注释。`DictSelect`、`DictTag` 复用字典请求缓存。页面已注册，侧栏菜单由管理员手动配置。
- 普通配置的管理接口位于 `/api/v1/admin/configs`，支持列表、新增、更新（含键改名）、删除。管理页以文本值编辑；服务端通过 `ConfigManager` 写库并立即刷新缓存。配置内容不写入请求日志。
- 请求日志中间件独立于认证：SQLite 记录模式为 `off`、`all`、`white_list`，默认关闭；控制台输出默认开启。白名单规则存在 `sys_config`，只记录匹配路径。日志内容需对密码、密钥、Token 等敏感字段脱敏并限制长度。
- 请求日志查询通过鉴权接口 `GET /api/v1/admin/request-logs`，支持分页及方法、路径、状态码筛选；日志表未创建时返回空列表，查询不触发建表。`DELETE /api/v1/admin/request-logs` 支持按 ID 列表、时间段、某时间前/后或保留最新 N 条清理，返回删除条数；日志表未创建时返回 0。时间前/后是严格比较，最新按自增 ID 判定。日志中间件不将日志查询、清理和仪表盘接口自身写入 SQLite。管理端请求日志页支持跨分页多选和规则清理，均需确认。
- 文件库由 `file` 表保存元数据和存储来源。本地文件存于 `server/data/uploads/`，七牛文件由浏览器直传；本地文件访问域名及七牛 AK/SK、Bucket、根目录、上传和访问域名保存在 `sys_config.upload_settings`，Secret Key 不经读取接口返回。上传策略由管理员通过 `/api/v1/admin/upload-settings` 配置。`admin/src/api/uploadFile.ts` 与 `client/uploadFile.ts` 分别提供独立的浏览器上传入口，后者可复制到业务前端：调用公开 `/api/v1/uploads/strategy` 读取策略，本地上传到公开 `/api/v1/uploads/local`，七牛从公开 `/api/v1/uploads/token` 获取精确 objectKey 凭证、直传、再经公开 `/api/v1/uploads/complete` 核对并登记。公开上传接口不要求登录，按 IP 限流；返回的完整 `url` 是业务表应保存的访问地址，本地为文件接口地址，七牛为访问域名直链，不经 server 代理。切换策略不迁移旧文件。文件列表、归档、恢复和永久删除仍需管理员鉴权；文件管理页显示全部文件并可按归档状态筛选，归档后文件不再出现在选择器，但旧链接继续可用；恢复后重新可选。永久删除会移除文件元数据及相应存储中的原文件。当前后台/前台站点图标或登录背景引用会阻止永久删除，业务表及外部保存的链接无法自动检测，需由管理员确认。管理端的文件选择弹窗支持单选、多选、预览和现场上传；站点图标从文件库选择。
- 菜单结构存于 `menu` 表，首次运行写入默认一级/二级菜单；启动时不删除或调整已有菜单。修改密码入口在账号下拉菜单。`MenuService` 启动后加载到内存，`GET /api/v1/admin/menus` 读缓存，`PUT /api/v1/admin/menus` 事务写库成功后刷新缓存。菜单配置只控制导航，不作为路由注册或权限控制。
- 站点设置保存在 `sys_config`：项目名称、管理端页脚版权信息，后台与前台各自的网站标签名称、系统名称、图标元数据，以及管理端登录外观。版权信息在外观设置的项目名称后编辑，未配置时沿用原有的系统名称、当前年份与框架描述。公开 `GET /api/v1/site-settings` 供登录页及未来 `client` 读取，管理端从 `/api/v1/admin/site-settings` 读取并经鉴权写入；登录外观由独立 `PUT /api/v1/admin/site-settings/login-appearance` 保存，支持纯色、双色渐变方向、文件库背景图片及卡片背景透明度。图标入口使用文件选择弹窗，支持 PNG、JPEG、WebP、ICO，最大 2 MiB，不接收 SVG；旧版固定图标仍可读取。
- 前台访问通过公开 `POST /api/v1/visits` 上报；浏览器工具在 `client/visitTracker.ts` 保存访客 UUID 和最近上报的 UTC 日期，服务端以 `(visitor_id, visit_day)` 唯一约束兜底。每日仅记录首次访问的页面，属于尽力去重；清除存储后会生成新访客 ID。`GET /api/v1/admin/visits` 提供分页筛选访问日志。`GET /api/v1/admin/home` 聚合真实访问记录、近 7 天请求日志与业务用户数据。日志关闭时接口来源和热门接口为空。
- 代码按 API/Controller 边界、Service 业务层、Repository 数据访问层分层；鉴权、校验和安全能力分别放在中间件或独立模块。业务项目自行扩展业务表和 API。
- 普通业务列表可复用 `TableListRepository`：由服务端静态资源配置声明表、可返回字段、搜索、模糊/等值/范围/数组筛选、固定空值与非空约束和排序；请求只提供参数值，不允许选择任意表或列。用户、操作日志、访问日志、请求日志和文件列表已接入。请求日志表未创建时仍返回空列表；文件列表默认只返回可用文件，管理页显式传 `status=all`，选择器仍只取可用文件。注册、禁用、归档、恢复和日志清理等业务写操作仍由各自 Service 处理。
- 接口、环境变量与启动方式见 `server/README.md`；改动服务端接口时需同步管理端契约。

## admin 模块

- admin 使用 React 18、TypeScript、React Router v6、Ant Design v5，采用 Vite 构建独立 SPA。
- 只做单管理员后台通用流程：初始化向导（`/setup`，项目/站点名称与初始管理员一并配置）、登录（`/login`）、自适应管理端布局、首页仪表盘、系统管理（`/system-config`）、外观设置（`/appearance`）、配置管理（`/configs`）、上传设置（`/upload-settings`）、请求日志（`/request-logs`）、操作日志（`/operation-logs`）、访问日志（`/visit-logs`）、用户管理（`/users`）、文件管理（`/files`）、修改密码、退出登录和 404 兜底页。业务菜单与页面留给复制后的项目添加。
- 初始菜单中「首页」为独立一级菜单；系统管理、配置管理、请求日志、文件管理和菜单管理归入「系统设置」分组。访问日志页面已注册，菜单由管理员在后台自行配置，建议路径 `/visit-logs`。修改密码从右上角账号菜单进入。
- 菜单管理页（`/menus`）支持页面、分组两类新菜单，明确选择「一级菜单」或所属分组、通过可搜索、分类展示的弹出式图标面板选择预置 Lucide 图标及调整同级排序；侧栏与管理页共用菜单状态，保存后立即更新。旧版操作菜单只作兼容展示，可删除，不再提供新增或编辑入口。图标键在 `menus/menuUtils.tsx` 统一映射，分类在 `menus/menuIconCategories.ts` 维护，未分类的新图标自动进入「其他」，已有键需保持兼容。隐藏或删除菜单管理入口后仍可直接访问 `/menus` 恢复。
- 已开发页面信息集中在 `src/router/pageRegistry.ts`，包含路径、名称、默认菜单标识和图标、是否属于初始菜单及是否可用于菜单；登录、初始化和 404 页面也要登记，但不可选作菜单。新增页面时同时在 `src/router/routes.tsx` 注册路由并在页面清单登记；随后由管理员在菜单管理中选择页面并手动保存菜单。页面选择器标明已添加和未添加状态，选中页面时只自动补齐空白的菜单标识、名称与图标。页面清单不入库，也不自动创建菜单。
- 管理端表格按内容宽度决定是否横向滚动；容器能完整显示所有列时不应出现横向滚动条。
- 管理端主题将 Input、Select、Button 的默认控件高度统一为 40px，筛选栏不要再单独混用不同高度。
- 代码按页面（`pages`）、布局（`layouts`）、复用组件（`components`）、API 请求（`api`）、认证状态（`auth`）与路由守卫（`router`）分层。
- `hooks/useTableQuery.ts` 管理列表 URL 查询状态、分页、防过期响应和刷新；`components/crud/` 提供防抖筛选栏与带二次确认、防重复点击的操作列按钮。用户、操作日志、访问日志、请求日志和文件管理页已接入；文件选择弹窗继续使用局部列表状态，避免弹窗筛选占用页面 URL。新业务页只声明筛选字段、列和 API 契约，专有写操作保留在业务 Hook/Service。
- 文件管理表格支持点击大小、上传时间表头进行升降序排列，排序状态随 URL 保存；服务端文件列表仅接受 `createdAt`/`size` 与 `asc`/`desc` 白名单值，默认上传时间倒序，文件选择弹窗仍使用默认排序。
- 认证状态集中在 `src/auth/` 独立管理，Token 存放于 `sessionStorage`；页面与组件不直接发原始 fetch 请求或拼接 Authorization 头。
- 严格遵循管理端 `/api/v1/admin` 基础路径和 `{code, msg, data, success}` 契约。服务端 JSON 先按 `unknown` 处理并在请求层收窄，不使用 `any`。
- 管理端只访问真实 server：开发环境由 Vite 仅将 `/api/v1` 代理到 `SERVER_PROXY_TARGET`，不能使用 `/api` 代理前缀，否则会拦截 `/api-docs` 页面刷新；生产环境由网关配置同路径代理并将非接口页面路径回退到 `index.html`。没有预设管理员或本地模拟接口。
- `SiteSettingsProvider` 集中获取公开站点信息并同步后台浏览器标题、标签图标；登录页读取系统名称、图标及登录外观，初始化页和侧栏读取后台系统名称与图标。外观设置页并排编辑后台、前台站点信息，单独保存登录背景与卡片透明度；系统管理页保留日志和服务器状态。内容页最大宽度统一为 1400px。新页面菜单需管理员手动配置。
- 首页仪表盘从 `/api/v1/admin/home` 获取数据：访问统计、接口来源与热门接口来自真实访问记录和请求日志；近 7 日活跃用户、用户总数及新增用户趋势来自业务用户表。系统管理页展示服务器状态并提供仅含 SQLite 的数据库备份下载。管理端时间展示统一通过 `utils/dateTime.ts` 转换为本地 `YYYY-MM-DD HH:mm:ss`。
- 接口文档页位于 `/api-docs`，由 `pages/api-docs/apiCatalog.ts` 维护现有接口的端、模块、鉴权、参数与返回数据，`apiExamples.ts` 维护可复制的请求与成功响应 JSON 示例；二进制接口单独标注。页面支持分类筛选和搜索。新增或修改服务端接口时同步维护目录与示例；页面已注册路由与页面清单，侧栏菜单仍由管理员手动配置。


## Git 提交消息

提交消息使用中文，格式为：`【模块】【功能】细节描述`。

- 模块使用 `server`、`admin`、`client`、`文档` 等实际修改范围。
- 功能使用 `登录`、`初始化`、`配置` 等简短名称。
- 细节描述写清本次完成的具体内容，避免只写“修改”或“更新”。
- 一次提交跨多个模块时，模块可写 `全局`，或按主要改动选择模块。

示例：`【server】【登录】完成 JWT 生成与签发`。
