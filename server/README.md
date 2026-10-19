# server

单管理员后端基础框架。使用 Express 5、TypeScript、Zod、JWT 和 SQLite；框架维护 admin、config、sys_config、file、menu，按需创建 request_log。

## 启动

需要 Node.js 22 或更高版本。安装依赖后，将 .env.example 复制为 .env，设置随机的 JWT_SECRET（至少 32 字符）和 SETUP_KEY（至少 16 字符），再启动：

    npm install
    npm run dev

常用命令：npm run typecheck、npm run build、npm start。npm start 使用编译后的 dist/。配置中的 SQLITE_PATH 相对于 server/ 工作目录解析；默认数据库是 server/data/framework.sqlite，启动时自动建表。数据库文件、.env 和构建产物均被根目录 .gitignore 忽略。

ADMIN_ORIGIN 是允许跨域访问 API 的管理端来源，如 http://localhost:5173。没有 Origin 头的命令行请求可以正常访问。生产环境可采用同源反向代理。

## 初始化与认证

第一次访问 GET /api/v1/setup/status 返回 initialized=false。管理端让用户输入管理员用户名、密码和 SETUP_KEY，调用 POST /api/v1/setup/admin。初始化完成后只能登录，无法再次创建管理员。SETUP_KEY 是部署配置，不要放进前端构建产物。

管理员登录返回有效期 43200 秒的 JWT。后续请求携带 Authorization: Bearer <JWT>。修改密码会使已签发 Token 失效；当前没有刷新 Token 和服务端注销接口。

完整请求示例见 requests.http。用户名为 3–32 位字母、数字或下划线；密码长度 12–128。初始化成功后不自动登录。

## 接口契约

所有 API 位于 /api/v1 下，统一响应：

    { "code": 0, "msg": "成功", "data": {}, "success": true }

code=0 为成功，code=-1 为通用失败，其余数字码为明确的业务错误。success 仅在 code=0 时为 true。参数错误的 data 为 fieldErrors，其他错误的 data 为 null；同时保留准确的 HTTP 状态码。业务码在 src/api/codes.ts 集中定义。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | /api/v1/setup/status | 检查是否已创建管理员 |
| POST | /api/v1/setup/admin | 使用 SETUP_KEY 创建唯一管理员 |
| POST | /api/v1/auth/login | 登录并签发 JWT |
| GET | /api/v1/auth/me | 获取当前管理员 |
| PUT | /api/v1/auth/password | 修改密码并撤销旧 Token |
| GET | /api/v1/system-config | 获取日志模式、控制台配置及白名单 |
| PUT | /api/v1/system-config | 更新日志模式、控制台开关和格式 |
| GET | /api/v1/system-config/whitelist | 获取白名单规则 |
| POST | /api/v1/system-config/whitelist | 创建白名单规则 |
| PUT | /api/v1/system-config/whitelist/:id | 更新白名单规则 |
| DELETE | /api/v1/system-config/whitelist/:id | 删除白名单规则 |
| GET | /api/v1/configs | 获取普通配置列表 |
| POST | /api/v1/configs | 创建普通配置 |
| PUT | /api/v1/configs/:key | 更新普通配置，可修改键 |
| DELETE | /api/v1/configs/:key | 删除普通配置 |
| GET | /api/v1/menus | 从内存读取菜单列表，需要管理员 Token |
| PUT | /api/v1/menus | 原子替换全部菜单，需要管理员 Token |
| GET | /api/v1/site-settings | 公开读取后台与前台的站点名称和图标 URL |
| PUT | /api/v1/site-settings | 修改后台与前台的站点名称，需要管理员 Token |
| GET | /api/v1/site-settings/:target/icon | 公开读取图标二进制，target 为 admin 或 client |
| PUT | /api/v1/site-settings/:target/icon | 上传图标原始字节，需要管理员 Token |
| DELETE | /api/v1/site-settings/:target/icon | 删除图标，需要管理员 Token |
| PUT | /api/v1/site-settings/:target/icon-file | 从文件库选择图标，body 为 `{ "fileId": "UUID" }`，需要管理员 Token |
| GET | /api/v1/request-logs | 分页查询请求日志，需要管理员 Token |
| GET | /api/v1/files | 分页查询文件库，需要管理员 Token |
| POST | /api/v1/files | 上传原始文件，需要管理员 Token |
| GET | /api/v1/files/:id/content | 公开读取文件原始内容 |
| DELETE | /api/v1/files/:id | 归档文件，需要管理员 Token |

初始化与登录的成功响应示例：

    { "code": 0, "msg": "管理员初始化成功", "data": { "id": 1, "username": "admin" }, "success": true }
    { "code": 0, "msg": "登录成功", "data": { "token": "<JWT>", "tokenType": "Bearer", "expiresIn": 43200, "admin": { "id": 1, "username": "admin" } }, "success": true }

参数错误示例：

    { "code": 1001, "msg": "参数校验失败", "data": { "fieldErrors": { "username": ["用户名格式错误"] } }, "success": false }

## 目录职责

- src/api：接口、请求 Schema、业务码与统一响应。
- src/services：初始化、登录、配置与站点信息业务。
- src/repositories：SQLite 数据访问。
- src/security：密码哈希、初始化密钥、JWT。
- src/middleware：路由鉴权与请求日志。
- src/db：框架表创建和数据库连接。
- src/config：环境变量校验与配置内存管理。

## 配置与请求日志

`config` 存普通动态配置，字段包括名称、键、JSON 值、启用、备注、创建和更新时间；`sys_config` 存系统配置，没有启用字段。`ConfigManager` 启动时加载两类配置，普通配置用 `get(key, defaultValue)` 读取，系统配置用 `getSysConfig().get(key)` 读取；调用写入方法时同步更新 SQLite 与内存。旧版 `config` 表启动时自动补齐字段并保留原有记录。`/api/v1/configs` 提供普通配置增删改查，管理接口将值作为文本编辑，禁用的配置从 `get` 读取时返回默认值。

系统配置中的 `request_log_mode` 可设为 `off`（默认）、`all`、`white_list`；`request_log_whitelist` 保存规则列表。白名单模式只记录匹配的 `/api/v1` 请求。精准路径必须完整匹配；通配路径必须以 `/**` 结尾。记录模式开启时才创建 `request_log` 表，关闭后保留已有日志。

`console_log_enabled` 默认开启，`console_log_format` 默认 `[${time}][${method}] ${url}`。支持 `${time}`、`${method}`、`${url}`、`${status}`、`${duration}`、`${ip}`，其中耗时带 `ms`。请求日志记录路径、已脱敏的查询参数和请求体、响应 JSON、HTTP 状态、耗时、IP、Origin、Referer、User-Agent；请求/响应内容分别限制为 16 KiB，上传的二进制请求体只记录占位说明。普通配置接口的请求和响应内容会整体隐藏，避免配置值写入日志。

`GET /api/v1/request-logs` 支持 `page`（默认 1）、`pageSize`（默认 20，最大 100）、`method`、`path`（子串匹配）、`status` 查询参数，返回 `{items,total,page,pageSize}`。按新到旧排序，供管理端查看列表和单条详情；`request_log` 尚未创建时返回空列表，不会因查询而创建表。日志查询请求自身不会写入请求日志表。接口只读，不提供删除或修改日志的操作。

业务项目自行设计业务数据，不应直接修改框架认证表。

## 站点设置与图标

`GET /api/v1/site-settings` 返回 `{admin:{siteTitle,systemName,iconUrl},client:{siteTitle,systemName,iconUrl}}`，图标未设置时 `iconUrl=null`。默认后台名称为 `NodeBase Admin`，前台名称为 `NodeBase Client`。`PUT /api/v1/site-settings` 提交同样的双端对象，每端只需 `siteTitle`、`systemName` 两个非空字符串，最长 100 字符；响应包含最新 `iconUrl`。

图标上传以原始图片字节作为请求体，Content-Type 仅支持 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon`，最大 2 MiB。服务端校验文件头，不接受 SVG。图标分别存放在 `server/data/site-icons/admin.icon` 与 `server/data/site-icons/client.icon`，上传时覆盖对应文件；MIME 和版本号保存在 `sys_config`。返回的图标 URL 带版本参数，供页面刷新缓存。图标读取接口返回图片二进制，其余站点设置接口使用统一 JSON 响应格式。

新图标可通过 `PUT /api/v1/site-settings/:target/icon-file` 选用文件库的 `fileId`，只接受 PNG、JPEG、WebP、ICO 且不超过 2 MiB。选中后 `iconUrl` 返回文件库稳定链接；旧版固定图标继续可读，删除图标会清空文件引用与旧文件。

## 文件库

`GET /api/v1/files?page=1&pageSize=20&search=关键词&mimeTypes=image/png,image/jpeg` 返回 `{items,total,page,pageSize}`，按上传时间倒序，只列出未归档的文件。`mimeTypes` 可选，使用逗号分隔，在计数和分页前过滤类型。每条 `FileItem` 包含 `{id,name,mimeType,size,url,createdAt}`，其中 `url` 为 `/api/v1/files/:id/content`，可直接供图片、图标等资源复用。列表、上传、归档需要管理员 JWT；内容链接公开读取。

`POST /api/v1/files` 使用原始文件字节作为请求体，设置实际文件 MIME 的 `Content-Type`，并将文件名执行 `encodeURIComponent` 后放入 `X-File-Name`。首版支持 PNG、JPEG、WebP、ICO、GIF、PDF，最大 10 MiB；校验文件头并拒绝 SVG。元数据保存在 SQLite 的 `file` 表，文件本体保存在 `server/data/uploads/`，备份时两者要一起保存。`DELETE /api/v1/files/:id` 仅归档记录，让列表不再显示；已有内容链接仍可访问，避免业务引用失效。

## 菜单管理

菜单保存在 SQLite 的 `menu` 表。服务启动时加载到 `MenuService` 内存缓存；`GET /api/v1/menus` 返回缓存中的扁平 `MenuItem[]`，`PUT /api/v1/menus` 提交 `{ "items": MenuItem[] }`，在事务中替换全表，成功后刷新缓存。写库失败时缓存保持原值。首次初始化由 `sys_config.menu_initialized` 标记，因此保存空列表后重启不会重新生成默认菜单。此功能仅管理导航结构，不提供权限控制；若隐藏或删除菜单管理入口，可直接访问管理端 `/menus` 恢复。

`MenuItem` 为 `{key,label,type,parentKey,path,action,icon,sort,visible}`。`type` 取 `group`、`route`、`action`；`parentKey`、`path`、`action`、`icon` 均可为 `null`。分组只能是一级，二级菜单的父级必须是一级分组；路由使用不重复的站内绝对路径，操作目前仅支持 `change-password`。`sort` 是同级非负整数排序值，`visible` 决定是否显示；服务端校验唯一键、唯一路由、两级结构和类型字段。菜单 API 需要 JWT，不根据菜单配置决定接口权限。新增路由菜单时，管理端还需实现对应页面。

默认菜单：一级 `home`（首页，`/`，图标 `layout-dashboard`）与 `system-settings`（系统设置分组，图标 `settings`）；分组下依次是 `system-config`（`/system-config`，`setting`）、`configs`（`/configs`，`database`）、`request-logs`（`/request-logs`，`file-text`）、`files`（`/files`，`folder`）、`menu-management`（`/menus`，`menu`）。旧数据库中默认的 `change-password` 菜单在升级时移除一次，修改密码入口保留在管理端右上角账号菜单。
