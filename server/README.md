# server

单管理员后台与通用业务用户基础框架。使用 Express 5、TypeScript、Zod、JWT 和 SQLite；表结构由 `migrations/` 管理，按需创建 `request_log`。

## 启动

需要 Node.js 22 或更高版本。安装依赖后，将 .env.example 复制为 .env，设置随机的 JWT_SECRET（至少 32 字符）和 SETUP_KEY（至少 16 字符），再启动：

    npm install
    npm run dev

常用命令：npm run typecheck、npm run build、npm start。npm start 使用编译后的 dist/。配置中的 SQLITE_PATH 相对于 server/ 工作目录解析；默认数据库是 server/data/framework.sqlite。正式部署需设置 `NODE_ENV=production`，否则默认按开发环境执行 SQL。数据库文件、.env 和构建产物均被根目录 .gitignore 忽略。

`migrations/sql/` 放新数据库的建表与初始数据 SQL，仅首次启动按文件名顺序在一个事务内执行；开发期表结构变化直接修改这里的文件。`migrations/prod-sql/` 放正式升级脚本，所有环境每次启动都扫描并执行未执行的文件；`migrations/dev-sql/` 放开发库升级脚本，仅非生产环境自动执行，正式上线前可清理。升级脚本按文件名顺序执行，生产脚本先于开发脚本；每个脚本和执行记录同事务提交。新库将当时已有的升级脚本记为基线，避免在最新初始化结构上重复升级；已有数据库会执行未记录的脚本。已记录脚本若被修改，启动会报错，应新增后续脚本。迁移 SQL 统一使用 LF 换行，避免不同系统检出的文件产生不同校验值。若无需保留开发数据，可删除本地数据库后重新初始化。

`TRUSTED_PROXIES` 默认为空；只有部署在受信任的反向代理后，才填写代理 IP/CIDR。限流与审计依赖正确的来源 IP。内存限流仅适用于单进程，重启会重置计数，多实例部署需要共享计数存储。

ADMIN_ORIGIN 是允许跨域访问管理端 API 的来源，如 http://localhost:5173。公开站点信息、文件内容和访问上报允许跨域读取或提交；没有 Origin 头的命令行请求可以正常访问。生产环境可采用同源反向代理。

## 初始化与认证

新增接口时，只有管理端使用的接口放在 `src/api/admin/` 并使用 `/api/v1/admin/**`；admin 与 client 共用的接口放在公共路由模块，使用 `/api/v1/**`，不加 `admin` 前缀。

第一次访问 GET /api/v1/admin/setup/status 返回 initialized=false。管理端 setup 页让用户填写项目名称、管理后台与前台的标签/系统名称、管理员用户名和密码，以及 SETUP_KEY，调用 POST /api/v1/admin/setup/admin 一次提交；管理员与项目站点信息在同一数据库事务内创建。初始化完成后只能登录，无法再次创建管理员。SETUP_KEY 是部署配置，不要放进前端构建产物。

管理员登录返回有效期 43200 秒的 JWT。后续请求携带 Authorization: Bearer <JWT>。修改密码会使已签发 Token 失效；当前没有刷新 Token 和服务端注销接口。

完整请求示例见 requests.http。用户名为 3–32 位字母、数字或下划线；密码长度 12–128。端口、JWT_SECRET、SETUP_KEY 仍在启动前通过 `.env` 配置。仓库不跟踪数据库和上传文件，复制项目时不会复制 Git 中的示例数据；setup 页不会删除已有数据。初始化成功后不自动登录。

## 接口契约

管理端 API 位于 `/api/v1/admin/**`，公开接口位于 `/api/v1/**`，统一响应：

    { "code": 0, "msg": "成功", "data": {}, "success": true }

code=0 为成功，code=-1 为通用失败，其余数字码为明确的业务错误。success 仅在 code=0 时为 true。参数错误的 data 为 fieldErrors，其他错误的 data 为 null；同时保留准确的 HTTP 状态码。业务码在 src/api/codes.ts 集中定义。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | /api/v1/admin/setup/status | 检查是否已创建管理员 |
| POST | /api/v1/admin/setup/admin | 使用 SETUP_KEY 一次创建唯一管理员并设置项目/站点名称 |
| POST | /api/v1/admin/auth/login | 登录并签发 JWT |
| GET | /api/v1/admin/auth/me | 获取当前管理员 |
| PUT | /api/v1/admin/auth/password | 修改密码并撤销旧 Token |
| GET | /api/v1/admin/system-config | 获取日志模式、控制台配置及白名单 |
| PUT | /api/v1/admin/system-config | 更新日志模式、控制台开关和格式 |
| GET | /api/v1/admin/system-config/whitelist | 获取白名单规则 |
| POST | /api/v1/admin/system-config/whitelist | 创建白名单规则 |
| PUT | /api/v1/admin/system-config/whitelist/:id | 更新白名单规则 |
| DELETE | /api/v1/admin/system-config/whitelist/:id | 删除白名单规则 |
| GET | /api/v1/admin/configs | 获取普通配置列表 |
| POST | /api/v1/admin/configs | 创建普通配置 |
| PUT | /api/v1/admin/configs/:key | 更新普通配置，可修改键 |
| DELETE | /api/v1/admin/configs/:key | 删除普通配置 |
| GET | /api/v1/admin/dictionaries | 获取字典类型及全部子项，需要管理员 Token |
| GET | /api/v1/admin/dictionaries/options?codes=a,b | 批量获取后台可用字典选项，需要管理员 Token |
| POST | /api/v1/admin/dictionaries | 创建字典类型，需要管理员 Token |
| PUT | /api/v1/admin/dictionaries/:id | 修改字典类型，需要管理员 Token |
| POST | /api/v1/admin/dictionaries/:id/items | 创建字典子项，需要管理员 Token |
| PUT | /api/v1/admin/dictionaries/:id/items/:itemId | 修改字典子项，需要管理员 Token |
| GET | /api/v1/admin/menus | 从内存读取菜单列表，需要管理员 Token |
| PUT | /api/v1/admin/menus | 原子替换全部菜单，需要管理员 Token |
| GET | /api/v1/admin/site-settings | 管理端读取后台与前台的站点名称和图标 URL，无需 Token |
| PUT | /api/v1/admin/site-settings | 修改后台与前台的站点名称，需要管理员 Token |
| PUT | /api/v1/admin/site-settings/:target/icon | 上传图标原始字节，需要管理员 Token |
| DELETE | /api/v1/admin/site-settings/:target/icon | 删除图标，需要管理员 Token |
| PUT | /api/v1/admin/site-settings/:target/icon-file | 从文件库选择图标，body 为 `{ "fileId": "UUID" }`，需要管理员 Token |
| GET | /api/v1/admin/home | 首页访问量、请求日志与真实业务用户统计，需要管理员 Token |
| GET | /api/v1/admin/operation-logs | 分页筛选操作审计日志，需要管理员 Token |
| GET | /api/v1/admin/system-status | 获取服务器状态，需要管理员 Token |
| POST | /api/v1/admin/backups/database | 下载 SQLite 在线备份，需要管理员 Token |
| GET | /api/v1/admin/users | 分页查询业务用户，需要管理员 Token |
| GET | /api/v1/admin/users/:id | 查询业务用户详情，需要管理员 Token |
| PUT | /api/v1/admin/users/:id/status | 禁用或启用业务用户，需要管理员 Token |
| GET | /api/v1/admin/visits | 分页筛选访问日志，需要管理员 Token |
| GET | /api/v1/admin/request-logs | 分页查询请求日志，需要管理员 Token |
| DELETE | /api/v1/admin/request-logs | 按 ID 或时间范围清理请求日志，需要管理员 Token |
| GET | /api/v1/admin/files | 分页查询文件库，需要管理员 Token |
| POST | /api/v1/admin/files | 上传原始文件，需要管理员 Token |
| DELETE | /api/v1/admin/files/:id | 归档文件，需要管理员 Token |
| GET | /api/v1/site-settings | 公开读取站点名称和图标 URL |
| GET | /api/v1/dictionaries?codes=a,b | 批量获取公开且启用的字典选项 |
| GET | /api/v1/site-settings/:target/icon | 公开读取图标二进制 |
| GET | /api/v1/files/:id/content | 公开读取文件原始内容，保留已分发链接 |
| POST | /api/v1/visits | 前台访问上报，无需 Token |
| POST | /api/v1/users/register | 业务用户账号密码注册 |
| POST | /api/v1/users/login | 业务用户登录并签发独立 JWT |
| GET | /api/v1/users/me | 获取当前业务用户，需要用户 Token |
| GET | /health | 公开服务就绪探针，数据库不可用时返回 HTTP 503 |

初始化与登录的成功响应示例：

    { "code": 0, "msg": "管理员初始化成功", "data": { "id": 1, "username": "admin" }, "success": true }
    { "code": 0, "msg": "登录成功", "data": { "token": "<JWT>", "tokenType": "Bearer", "expiresIn": 43200, "admin": { "id": 1, "username": "admin" } }, "success": true }

参数错误示例：

    { "code": 1001, "msg": "参数校验失败", "data": { "fieldErrors": { "username": ["用户名格式错误"] } }, "success": false }

数据字典的类型标识 `code` 与子项值 `value` 创建后不可修改；更新接口仅接受名称、备注、公开/启用状态等可编辑字段。停用的子项保留在管理列表中，但不出现在选项接口。管理端写入成功后刷新服务端字典缓存。新库由 `migrations/sql/0004_dictionary.sql` 建表；已有开发库由 `migrations/dev-sql/0001_dictionary.sql` 自动补建。

## 目录职责

- src/api/admin：管理端接口；src/api/public-routes.ts：公开接口。其余 src/api 文件存放请求 Schema、业务码与统一响应。
- src/services：初始化、登录、配置与站点信息业务。
- src/repositories：SQLite 数据访问。
- src/security：密码哈希、初始化密钥、JWT。
- src/middleware：路由鉴权与请求日志。
- src/db：SQLite 连接、首次初始化与自动升级；`migrations/sql/` 保存初始化 SQL，`migrations/dev-sql/` 和 `migrations/prod-sql/` 保存升级 SQL。
- src/config：环境变量校验与配置内存管理。

普通业务列表可使用 `src/repositories/table-list.repository.ts` 的 `TableListRepository`。资源在服务端代码中静态声明表、返回列、搜索列、等值/模糊/范围/数组筛选、固定 `IS NULL` 约束和排序；用户、操作日志、访问日志、请求日志、文件列表的配置示例位于 `src/repositories/resources/`。Controller 仍使用专属 Zod Schema 校验查询参数，Service 保留业务规则。表名和列名仅来自代码配置，筛选值使用 SQLite 参数绑定，模糊查询转义通配符。用户列表不会将密码哈希作为列表字段读取；请求日志表未创建时查询仍返回空列表，文件列表固定排除已归档文件。包含副作用的写操作仍由业务 Service 和对应 Repository 实现。

## 配置与请求日志

`config` 存普通动态配置，字段包括名称、键、JSON 值、启用、备注、创建和更新时间；`sys_config` 存系统配置，没有启用字段。`ConfigManager` 启动时加载两类配置，普通配置用 `get(key, defaultValue)` 读取，系统配置用 `getSysConfig().get(key)` 读取；调用写入方法时同步更新 SQLite 与内存。当前开发版不兼容早期缺少字段的 `config` 表。`/api/v1/admin/configs` 提供普通配置增删改查，管理接口将值作为文本编辑，禁用的配置从 `get` 读取时返回默认值。

系统配置中的 `request_log_mode` 可设为 `off`（默认）、`all`、`white_list`；`request_log_whitelist` 保存规则列表。白名单模式只记录匹配的 `/api/v1` 请求。精准路径必须完整匹配；通配路径必须以 `/**` 结尾。记录模式开启时才创建 `request_log` 表，关闭后保留已有日志。

`console_log_enabled` 默认开启，`console_log_format` 默认 `[${time}][${method}] ${url}`。支持 `${time}`、`${method}`、`${url}`、`${status}`、`${duration}`、`${ip}`，其中耗时带 `ms`。请求日志记录路径、已脱敏的查询参数和请求体、响应 JSON、HTTP 状态、耗时、IP、Origin、Referer、User-Agent；请求/响应内容分别限制为 16 KiB，上传的二进制请求体只记录占位说明。普通配置接口的请求和响应内容会整体隐藏，避免配置值写入日志。

`GET /api/v1/admin/request-logs` 支持 `page`（默认 1）、`pageSize`（默认 20，最大 100）、`method`、`path`（子串匹配）、`status` 查询参数，返回 `{items,total,page,pageSize}`。按新到旧排序，供管理端查看列表和单条详情；`request_log` 尚未创建时返回空列表，不会因查询而创建表。`DELETE /api/v1/admin/request-logs` 可提交以下互斥模式，返回 `{deleted}`：

| mode | 请求体其余字段 | 删除范围 |
| --- | --- | --- |
| `ids` | `ids:[1,2]` | 1～500 个正整数 ID 指定的记录 |
| `timeRange` | `startTime`、`endTime` | 起止时间内，含两端 |
| `beforeTime` | `time` | 严格早于指定时间 |
| `afterTime` | `time` | 严格晚于指定时间 |
| `keepLatest` | `count` | 按自增 ID 保留最新 N 条，删除其余记录；N 为 1～1,000,000 |

时间字段均为带时区的 ISO 时间，服务端先转为 UTC 再按 SQLite 中的 ISO 时间比较。删除后仪表盘的请求日志指标随之变化。日志表不存在时清理返回 0。日志查询、清理与仪表盘查询请求自身不会写入请求日志表。旧白名单中的管理端路径需按新 `/api/v1/admin/` 前缀调整，公开接口路径保持原样。

业务项目可扩展通用用户资料与业务表，管理员认证表继续保持单管理员约束。

## 业务用户与操作审计

业务用户使用不区分大小写的唯一账号和密码注册。`POST /api/v1/users/register` 提交 `{account,password,nickname?}`；`POST /api/v1/users/login` 返回用户 JWT；`GET /api/v1/users/me` 使用该 Token。用户 JWT 与管理员 JWT 的身份声明不同，不能互用。管理员可通过 `/api/v1/admin/users` 查询用户，通过 `PUT /api/v1/admin/users/:id/status` 传 `{status:"active"|"disabled"}` 修改状态；状态变化会撤销旧 Token。登录及认证请求按 UTC 日记录 `user_activity`，供近 7 日活跃用户统计。

`operation_log` 与 HTTP `request_log` 独立，记录成功的框架管理员写操作，包括配置、菜单、站点、文件、用户状态和数据库备份。`GET /api/v1/admin/operation-logs` 支持 `page`、`pageSize`、`module`、`actor`、`startTime`、`endTime`。业务模块在 Service 层显式调用 `OperationLogService.record()`，传操作人、模块、动作、目标与安全摘要；只记涉及的字段名，不保存密码、Token 或完整请求/响应。框架操作在响应成功后尽力写入审计；需要审计与业务数据严格同事务的业务模块，应在自身 Service 事务中显式调用记录器。

## 健康检查、限流与备份

`GET /health` 公开返回 `{status:"ok"}`，数据库不可读时返回 HTTP 503。管理员 `GET /api/v1/admin/system-status` 返回 Node 版本、运行时长、内存、CPU、数据库文件大小与可用磁盘空间；状态最多缓存 5 秒。

管理员 `POST /api/v1/admin/backups/database` 在线生成并下载 `.sqlite.bak`，临时文件在下载结束后删除。**备份只包含 SQLite 数据库，不包含 `server/data/uploads/` 与 `server/data/site-icons/` 中的文件。**需要完整恢复图片与文件链接时，应另行备份这两个目录。

管理员和业务用户登录失败按 IP 限制 15 分钟内最多 5 次；注册、访问上报、管理端上传有独立的分钟级限流，超限返回 HTTP 429、业务码 1012 和 `Retry-After`。服务器默认不信任转发来源 IP；使用反向代理时需配置 `TRUSTED_PROXIES`。Helmet 提供基础安全响应头，公开图片资源允许跨域引用。

## 访问统计与首页仪表盘

前台在页面首次加载时调用 `POST /api/v1/visits`，请求体为 `{visitorId, path, pageTitle?, referrer?}`。`visitorId` 为浏览器持久保存的 UUID；`path` 是不含查询串的站内绝对路径。服务端同时保存请求 IP、User-Agent、首次访问时间和 UTC 日期。`visit` 表对 `(visitor_id, visit_day)` 建唯一约束：当日首次写入返回 `{recorded:true,day}`，重复提交返回 `{recorded:false,day}`。同一访客每天仅记录首次进入的页面，因此路径代表当日入口页。浏览器清除存储或更换设备后会获得新访客 ID，本机制仅用于尽力去重，不是可靠用户身份鉴别。可复用前端工具见 `client/visitTracker.ts`。

`GET /api/v1/admin/home` 需要管理员 JWT，返回今日、昨日和近 7 天访问量，以及近 7 天、近 30 天每日趋势；还聚合近 7 天已记录的接口日志，提供请求数、HTTP 4xx 以下占比、Origin/Referer 来源和请求最多的接口路径。请求日志关闭或白名单未覆盖接口时，相关统计只基于已有日志；日志表不存在时返回空指标。`users` 字段从业务用户表与 `user_activity` 聚合用户总数、近 7 日活跃用户、近 7 日新增用户和趋势，`source` 为 `real`。

`GET /api/v1/admin/visits` 支持 `page`、`pageSize`（最大 100）、`path`、`visitorId` 子串查询，以及 `startDay`、`endDay`（UTC 日期 `YYYY-MM-DD`）筛选，按最新记录排序，返回 `{items,total,page,pageSize}`。访问日志页面在管理端 `/visit-logs`，导航菜单由管理员自行配置，不自动写入默认菜单。

## 站点设置与图标

`GET /api/v1/site-settings` 和管理端 `GET /api/v1/admin/site-settings` 返回 `{admin:{siteTitle,systemName,iconUrl},client:{siteTitle,systemName,iconUrl}}`，图标未设置时 `iconUrl=null`。默认后台名称为 `NodeBase Admin`，前台名称为 `NodeBase Client`。`PUT /api/v1/admin/site-settings` 提交同样的双端对象，每端只需 `siteTitle`、`systemName` 两个非空字符串，最长 100 字符；响应包含最新 `iconUrl`。

图标上传以原始图片字节作为请求体，Content-Type 仅支持 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon`，最大 2 MiB。服务端校验文件头，不接受 SVG。图标分别存放在 `server/data/site-icons/admin.icon` 与 `server/data/site-icons/client.icon`，上传时覆盖对应文件；MIME 和版本号保存在 `sys_config`。返回的图标 URL 带版本参数，供页面刷新缓存。图标读取接口返回图片二进制，其余站点设置接口使用统一 JSON 响应格式。

新图标可通过 `PUT /api/v1/admin/site-settings/:target/icon-file` 选用文件库的 `fileId`，只接受 PNG、JPEG、WebP、ICO 且不超过 2 MiB。选中后 `iconUrl` 返回文件库稳定链接；旧版固定图标继续可读，删除图标会清空文件引用与旧文件。

## 文件库

`GET /api/v1/admin/files?page=1&pageSize=20&search=关键词&mimeTypes=image/png,image/jpeg&sortBy=size&sortOrder=desc` 返回 `{items,total,page,pageSize}`，只列出未归档的文件。`mimeTypes` 可选，使用逗号分隔，在计数和分页前过滤类型。`sortBy` 仅允许 `createdAt`、`size`，`sortOrder` 仅允许 `asc`、`desc`，默认按上传时间倒序；同值时按 ID 倒序保证分页稳定。每条 `FileItem` 包含 `{id,name,mimeType,size,url,createdAt}`，其中 `url` 为稳定公开路径 `/api/v1/files/:id/content`，可直接供图片、图标等资源复用。列表、上传、归档需要管理员 JWT；内容链接公开读取。

`POST /api/v1/admin/files` 使用原始文件字节作为请求体，设置实际文件 MIME 的 `Content-Type`，并将文件名执行 `encodeURIComponent` 后放入 `X-File-Name`。首版支持 PNG、JPEG、WebP、ICO、GIF、PDF，最大 10 MiB；校验文件头并拒绝 SVG。元数据保存在 SQLite 的 `file` 表，文件本体保存在 `server/data/uploads/`，内置数据库备份不包含文件本体。`DELETE /api/v1/admin/files/:id` 仅归档记录，让列表不再显示；已有内容链接仍可访问，避免业务引用失效。

## 菜单管理

菜单保存在 SQLite 的 `menu` 表。服务启动时加载到 `MenuService` 内存缓存；`GET /api/v1/admin/menus` 返回缓存中的扁平 `MenuItem[]`，`PUT /api/v1/admin/menus` 提交 `{ "items": MenuItem[] }`，在事务中替换全表，成功后刷新缓存。写库失败时缓存保持原值。首次初始化由 `sys_config.menu_initialized` 标记，因此保存空列表后重启不会重新生成默认菜单。此功能仅管理导航结构，不提供权限控制；若隐藏或删除菜单管理入口，可直接访问管理端 `/menus` 恢复。

`MenuItem` 为 `{key,label,type,parentKey,path,action,icon,sort,visible}`。新菜单通过管理端创建 `group` 或 `route`；`action` 仅为旧数据及接口兼容保留，管理端不再提供新增或编辑入口。`parentKey`、`path`、`action`、`icon` 均可为 `null`。分组只能是一级，二级菜单的父级必须是一级分组；路由使用不重复的站内绝对路径。`sort` 是同级非负整数排序值，`visible` 决定是否显示；服务端校验唯一键、唯一路由、两级结构和类型字段。菜单 API 需要 JWT，不根据菜单配置决定接口权限。新增页面时，管理端需同时注册路由并更新页面清单，再由管理员手动配置菜单。

默认菜单：一级 `home`（首页，`/`，图标 `layout-dashboard`）与 `system-settings`（系统设置分组，图标 `settings`）；分组下依次是 `system-config`（`/system-config`，`setting`）、`configs`（`/configs`，`database`）、`request-logs`（`/request-logs`，`file-text`）、`files`（`/files`，`folder`）、`menu-management`（`/menus`，`menu`）。服务端启动时不会删除或调整已有菜单；修改密码入口保留在管理端右上角账号菜单。
