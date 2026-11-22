# server 模块约定

> 本文件维护 `server/` 模块的开发规范与实现边界；全局跨模块契约（响应结构、分页标准、UUID 规范、文档同步要求及 Git 提交规范）见根目录 [AGENTS.md](../AGENTS.md)。

## 技术栈与分层

- server 使用 Express 5、TypeScript、Zod、JWT 和 SQLite（`better-sqlite3`）。
- 仅管理端使用的接口统一使用 `/api/v1/admin/**` 并放入 `server/src/api/admin/`；admin/client 共用或公开接口使用 `/api/v1/**`，放入公共路由模块（`server/src/api/*.ts`）。
- 代码严格按 API/Controller 边界（`src/api/`）、Service 业务层（`src/services/`）、Repository 数据访问层（`src/repositories/`）分层；鉴权、参数校验、日志和限流等横切能力放在 `src/middleware/` 或 `src/security/`；业务项目在此基础上自行扩展业务表与 API。

## 公共封装复用

- **分页统一封装**：所有分页查询和响应复用 [src/shared/pagination.ts](src/shared/pagination.ts)（`paginationQueryShape`、`PaginationQuery`、`PageResult<T>`、`createPageResult`、`mapPageResult`）。
- **通用列表查询**：普通单表业务列表复用 [src/repositories/table-list.repository.ts](src/repositories/table-list.repository.ts)（`TableListRepository`），由服务端静态资源配置（`src/repositories/resources/*.resource.ts`）声明表、可返回字段、搜索列、模糊/等值/范围/数组筛选、固定空值与非空约束和排序；请求只传参数值，严禁从请求参数构造任意表或列名。用户、操作日志、访问日志、请求日志和文件列表已接入。注册、禁用、归档、恢复和日志清理等写操作仍由各自 Service 处理。
- **对外资源 UUID**：生成与校验统一复用 [src/shared/public-id.ts](src/shared/public-id.ts)（32 位小写无连字符 UUID v4）。`user`、`dict_type`、`dict_item` 及按需创建的 `request_log` 已接入；单管理员 `admin`、以业务键定位的配置/菜单及纯追加/统计记录暂不额外加 UUID，后续新增表按实际对外单条操作需求判断。

## 数据库与迁移

- 框架数据库维护单管理员 `admin`、普通动态配置 `config`、系统配置 `sys_config`、每日去重访问记录 `visit` 等；请求日志开启后按需创建 `request_log`。
- 首次 setup 接口在同一事务内创建管理员并写入项目名称及后台/前台站点名称，不预设账号；端口、`JWT_SECRET`、`SETUP_KEY` 在启动前由 `.env` 配置。setup 不删除已有数据库或上传文件，仓库也不跟踪运行时数据文件。
- `server/migrations/` 分 `sql/`、`dev-sql/`、`prod-sql/`：
  - `sql/` 仅在新库首次启动时按文件名执行建表和初始数据，可在开发期直接维护最新结构。
  - `prod-sql/` 在所有环境每次启动时扫描并执行未执行的升级脚本。
  - `dev-sql/` 只在非生产环境自动执行，正式上线前可清理。
  - 新库将当前升级脚本记为基线，避免重复修改最新结构；已有库的每个升级脚本与执行记录同事务提交，已执行脚本内容变化会阻止启动，需新增后续脚本而非改动旧脚本。迁移 SQL 由 `.gitattributes` 固定为 LF 换行，避免跨平台校验值不同。
- 生产部署需在 `.env` 设置 `NODE_ENV=production`。管理员可下载 SQLite 在线备份，备份不包含 `server/data/uploads/` 与 `server/data/site-icons/`，临时备份文件下载后清理。

## 核心模块与安全规则

- **安全与限流**：登录失败按 IP 与账号组合限流，重置管理员密码按 IP 失败限流，公开注册、访问上报和上传接口分别限流；当 `NODE_ENV=development`（dev 模式）时全站限流自动关闭，生产环境（`NODE_ENV=production`）正常启用；限流器仅适用于单进程部署。`TRUSTED_PROXIES` 只填写可信反向代理。`/health` 为公开就绪探针；管理员 `system-status` 提供缓存（5 秒）的运行状态。安全响应头由 Helmet 设置，公开图片允许跨域加载。
- **管理员密码重置**：支持通过 `POST /api/v1/admin/auth/reset-password` 提交 `SETUP_KEY` 与新密码重置唯一管理员密码，并递增 `token_version` 撤销已有管理员 JWT。
- **配置管理**：`ConfigManager` 启动时加载 `config` 与 `sys_config` 并维护内存缓存；普通配置用 `get(key, defaultValue)` 读取，系统配置用 `getSysConfig().get(key)` 读取，写入时同步写库并刷新缓存。`config.enabled` 控制普通配置是否生效，`sys_config` 无启用字段。普通配置管理接口位于 `/api/v1/admin/configs`（支持改键），配置内容不写入请求日志。
- **操作审计**：`operation_log` 独立保存管理员成功写操作的摘要、操作者、目标、IP 和耗时；业务 Service 可显式调用 `OperationLogService.record()`，严禁记录密码、Token、原始请求体和响应体。
- **数据字典**：使用 `dict_type` 与 `dict_item` 管理可配置展示选项。类型 `code` 与子项 `value` 创建后不可修改，已有选项通过停用保留历史值；核心业务状态流转仍由业务代码控制。字典服务启动加载内存缓存，写入后刷新；管理接口位于 `/api/v1/admin/dictionaries`，批量新增（`/batch`、`/:id/items/batch`）最多 20 条且整批事务提交；公共接口 `/api/v1/dictionaries` 仅返回公开且启用的类型与子项。
- **请求日志**：日志中间件独立于认证，SQLite 记录模式为 `off`（默认）、`all`、`white_list`，控制台输出默认开启；白名单规则存于 `sys_config`。日志内容须对密码、密钥、Token 等敏感字段脱敏并截断长度。`GET /api/v1/admin/request-logs` 与 `DELETE /api/v1/admin/request-logs` 在 `request_log` 表未创建时均安全返回空列表/0 且不触发建表。日志查询、清理与仪表盘接口自身不写入 SQLite 请求日志。
- **文件库与上传**：`file` 表保存元数据与存储来源，本地文件存于 `server/data/uploads/`，七牛文件由浏览器直传；上传策略与七牛配置存于 `sys_config.upload_settings`，Secret Key 不经读取接口返回。公开 `POST /api/v1/uploads/prepare`、`POST /api/v1/uploads/local`、`POST /api/v1/uploads/complete` 按 IP 限流，不要求登录；返回的完整 `url` 直接存入业务表，不经 server 代理。切换策略不迁移旧文件。文件列表默认只返回可用文件（管理页显式传 `status=all`），归档后选择器不可见但旧链接仍可访问；永久删除会同时删除元数据及存储文件，当前站点图标或登录背景引用会阻止永久删除。
- **菜单与站点设置**：`MenuService` 启动加载缓存，`PUT /api/v1/admin/menus` 事务替换并刷新缓存，菜单仅控制导航不做权限控制。站点设置存于 `sys_config`（项目名称、版权信息、后台/前台标识与图标元数据、登录外观），图标仅支持 PNG、JPEG、WebP、ICO（最大 2 MiB，拒绝 SVG）。
- **访问统计**：公开 `POST /api/v1/visits` 以 `(visitor_id, visit_day)` 唯一约束按 UTC 日尽力去重；`GET /api/v1/admin/home` 聚合真实访问记录与近 7 天请求日志数据。

## 接口文档维护规范（`server/api-docs/`）

- 服务端接口文档统一维护在 [api-docs/index.md](api-docs/index.md) 及子目录下，按调用端与模块划分两类路径：
  - 管理端接口：`server/api-docs/admin/<module>/<endpoint>.md`
  - 客户端 / 公开接口：`server/api-docs/client/<module>/<endpoint>.md`
- **同步要求**：每次新增、修改或删除服务端接口（含路径、请求参数、校验规则、响应字段、错误码或鉴权/限流变更），**必须同步更新**：
  1. `server/api-docs/index.md` 索引表；
  2. 对应模块目录下的 `<endpoint>.md` 详细文档（删除接口时同步移除对应文档）；
  3. 按需核对 [server/README.md](README.md) 中的功能说明，以及管理端 `requestLogEndpoints.ts` 的排除路径清单。
