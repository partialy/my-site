# 项目约定

本仓库是可复制的项目基础框架。`server/` 放通用后端，`admin/` 放管理端，`client/` 留给具体项目开发；根目录统一使用一个 Git 仓库。

## server 模块

- server 使用 Express 5、TypeScript、Zod、JWT 和 SQLite。HTTP API 统一使用 `/api/v1` 前缀，响应结构为 `{code, msg, data, success}`。
- 框架数据库维护单管理员 `admin`、普通动态配置 `config`、系统配置 `sys_config`；请求日志开启后按需创建 `request_log`。首次管理员由初始化接口创建，不预设账号。
- `ConfigManager` 启动时加载配置并保持内存缓存；普通配置通过 `get(key, defaultValue)` 读取，系统配置通过 `getSysConfig().get(key)` 读取，写入时同步更新数据库和缓存。`config.enabled` 控制普通配置是否生效，`sys_config` 没有启用字段。
- 普通配置的管理接口位于 `/api/v1/configs`，支持列表、新增、更新（含键改名）、删除。管理页以文本值编辑；服务端通过 `ConfigManager` 写库并立即刷新缓存。配置内容不写入请求日志。
- 请求日志中间件独立于认证：SQLite 记录模式为 `off`、`all`、`white_list`，默认关闭；控制台输出默认开启。白名单规则存在 `sys_config`，只记录匹配路径。日志内容需对密码、密钥、Token 等敏感字段脱敏并限制长度。
- 站点设置保存在 `sys_config`：后台与前台分别有网站标签名称、系统名称和图标元数据。公开 `GET /api/v1/site-settings` 供登录页及未来 `client` 读取；写入接口需要管理员 JWT。图标以原始图片上传，验证文件头后保存在 `server/data/site-icons/`，后台与前台各一个固定文件，最大 2 MiB，不接收 SVG。
- 代码按 API/Controller 边界、Service 业务层、Repository 数据访问层分层；鉴权、校验和安全能力分别放在中间件或独立模块。业务项目自行扩展业务表和 API。
- 接口、环境变量与启动方式见 `server/README.md`；改动服务端接口时需同步管理端契约。

## admin 模块

- admin 使用 React 18、TypeScript、React Router v6、Ant Design v5，采用 Vite 构建独立 SPA。
- 只做单管理员后台通用流程：初始化向导（`/setup`）、登录（`/login`）、自适应管理端布局、首页占位、系统管理（`/system-config`）、配置管理（`/configs`）、修改密码、退出登录和 404 兜底页。业务菜单与页面留给复制后的项目添加。
- 代码按页面（`pages`）、布局（`layouts`）、复用组件（`components`）、API 请求（`api`）、认证状态（`auth`）与路由守卫（`router`）分层。
- 认证状态集中在 `src/auth/` 独立管理，Token 存放于 `sessionStorage`；页面与组件不直接发原始 fetch 请求或拼接 Authorization 头。
- 严格遵循 `/api/v1` 基础路径和 `{code, msg, data, success}` 契约。服务端 JSON 先按 `unknown` 处理并在请求层收窄，不使用 `any`。
- 管理端只访问真实 server：开发环境由 Vite 将 `/api/v1` 代理到 `SERVER_PROXY_TARGET`，生产环境由网关配置同路径代理。没有预设管理员或本地模拟接口。
- `SiteSettingsProvider` 集中获取公开站点信息并同步后台浏览器标题、标签图标；登录页、初始化页和侧栏读取后台系统名称与图标。系统管理页用独立区块并排编辑后台、前台站点信息，内容页最大宽度统一为 1400px。


## Git 提交消息

提交消息使用中文，格式为：`【模块】【功能】细节描述`。

- 模块使用 `server`、`admin`、`client`、`文档` 等实际修改范围。
- 功能使用 `登录`、`初始化`、`配置` 等简短名称。
- 细节描述写清本次完成的具体内容，避免只写“修改”或“更新”。
- 一次提交跨多个模块时，模块可写 `全局`，或按主要改动选择模块。

示例：`【server】【登录】完成 JWT 生成与签发`。
