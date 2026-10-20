# NodeBase Admin

React + TypeScript + React Router + Ant Design 单管理员后台。直接对接同仓库 server/，不提供本地模拟账号或模拟接口。

## 本地启动

1. 在 server/ 根据 .env.example 创建 .env，配置 JWT_SECRET 与 SETUP_KEY，然后运行 npm install、npm run dev。
2. 在 admin/ 运行 npm install、npm run dev，访问 http://localhost:5173/。
3. 首次访问会从 GET /api/v1/admin/setup/status 判断是否已有管理员。若没有，进入初始化页；初始化密钥填写 server/.env 中的 SETUP_KEY。初始化成功后使用新账号登录。

admin/.env.example 给出开发代理配置。VITE_API_BASE_URL 默认 /api/v1/admin；SERVER_PROXY_TARGET 默认 http://127.0.0.1:3000。Vite 开发服务器会将 /api 请求代理到 server，生产部署则需要网关将 /api/v1 转发到 server，且 SPA 路由回退到 index.html。

管理员密码与密钥不写入前端构建产物。JWT 存放在当前标签页的 sessionStorage；退出登录清理本地 Token，修改密码会由 server 使旧 Token 失效。

## 命令

- npm run dev：启动开发服务器。
- npm run typecheck：TypeScript 类型检查。
- npm run build：构建生产文件。
- npm run preview：预览构建文件；预览环境也需配置 /api/v1 的反向代理才能调用 server。

## 接口

管理接口使用 /api/v1/admin 前缀，公开文件内容和站点图标继续使用 /api/v1。响应格式为 {code, msg, data, success}。code=0 为成功，-1 为通用失败，其余数字码表示明确的业务错误。admin/src/api/ 集中处理请求、响应数据校验及业务码；admin/src/auth/ 管理会话，页面不直接拼接 Token。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | /api/v1/admin/setup/status | 获取初始化状态 |
| POST | /api/v1/admin/setup/admin | 创建唯一管理员 |
| POST | /api/v1/admin/auth/login | 登录并获取 JWT |
| GET | /api/v1/admin/auth/me | 校验会话并读取管理员 |
| PUT | /api/v1/admin/auth/password | 修改密码 |
| GET、PUT | /api/v1/admin/system-config | 查看和保存系统日志配置 |
| GET、POST | /api/v1/admin/system-config/whitelist | 查询、添加请求日志白名单 |
| PUT、DELETE | /api/v1/admin/system-config/whitelist/:id | 修改、删除白名单规则 |
| GET、POST | /api/v1/admin/configs | 查询、新增普通配置 |
| PUT、DELETE | /api/v1/admin/configs/:key | 修改、删除普通配置 |
| GET | /api/v1/admin/request-logs | 分页筛选请求日志，支持 page、pageSize、method、path、status |
| DELETE | /api/v1/admin/request-logs | 按选中 ID、时间段、某时间前/后或保留最新 N 条清理请求日志 |
| GET | /api/v1/admin/home | 访问统计、近 7 天请求日志聚合与用户演示数据 |
| GET | /api/v1/admin/visits | 分页筛选访问日志，支持路径、访客 ID 与 UTC 日期范围 |
| GET、POST | /api/v1/admin/files | 文件列表（支持 page、pageSize、search、mimeTypes）与原始文件上传 |
| GET | /api/v1/files/:id/content | 公开访问文件内容，可直接用于图片和下载链接 |
| DELETE | /api/v1/admin/files/:id | 从文件库归档文件，已分发的链接继续可用 |
| GET、PUT | /api/v1/admin/site-settings | 读取和修改后台、前台网站名称 |
| GET | /api/v1/site-settings | 供前台公开读取站点信息 |
| GET | /api/v1/site-settings/:target/icon | 公开读取系统图标 |
| PUT、DELETE | /api/v1/admin/site-settings/:target/icon | 上传、移除系统图标 |
| PUT | /api/v1/admin/site-settings/:target/icon-file | 从文件管理器选择系统图标 |
| GET、PUT | /api/v1/admin/menus | 读取菜单缓存、整体保存一级和二级菜单结构 |

服务端 500 或网络故障不会清理已保存的 Token，界面会提示重试；只有 1005、1006、1007 会按会话失效处理。控制台不展示预设业务统计，具体项目可接入真实业务数据。

系统管理页位于 `/system-config`，可从下拉框选择请求日志记录模式（关闭、全部、白名单）、管理白名单规则，以及设置控制台日志开关和输出模板。模板变量显示中文名称，点击复制变量文本。

配置管理页位于 `/configs`，通过表格和弹窗维护 `config` 表中的名称、键、值、启用状态及备注。所有设置均通过上述真实服务端接口读写。

请求日志页位于 `/request-logs`，支持按方法、路径和响应状态筛选，分页查看请求记录，并在详情弹窗查看已脱敏的请求参数、响应内容和来源信息。可跨分页勾选多条日志后确认清理，也可选择时间段、某时间前、某时间后、保留最新 N 条规则清理；规则针对全部日志，不受当前筛选条件影响。时间按浏览器本地时区选择：时间段包含起止秒，时间前/后不包含所选整秒；清理不可恢复。尚未启用请求日志时，列表为空。筛选栏的输入框、下拉框和按钮采用统一高度，文件管理搜索栏也遵循同一主题配置。

访问日志页位于 `/visit-logs`，支持按页面路径、访客 ID、UTC 日期范围筛选并查看详情。页面路由已注册；菜单由管理员在菜单管理中自行新增，可设置路径 `/visit-logs`。

文件管理页位于 `/files`，集中上传、预览、搜索、复制链接及归档文件。`FilePickerModal` 是通用文件选择弹窗，支持 MIME 类型过滤、单选或多选、搜索分页，并可直接上传新文件；上传后先选中，用户点击“确定”后才返回选择结果。文件列表与上传通过 `src/api/files.ts` 对接服务端，图片链接按 API 基础地址转换。

侧栏从服务端菜单数据渲染，登录后加载一次并在管理端内存中共享；菜单管理页位于 `/menus`，可添加、编辑、删除页面或分组菜单，明确选择「一级菜单」或所属分组，点击图标选择框后可按名称搜索，并在带小标题的分类区域选择预置 Lucide 图标（悬浮显示英文名称），调整同级顺序后整体保存并立即更新侧栏。新增页面菜单从代码维护的页面清单中选择，未添加页面排在前面，已添加页面标明状态且不能重复选用；选择后只填充空白的标识、名称和图标。预置图标键集中维护在 `src/menus/menuUtils.tsx`，分类维护在 `src/menus/menuIconCategories.ts`，未分类的新图标自动显示在「其他」。首次数据包含独立的「首页」和「系统设置」分组；修改密码从右上角账号菜单进入。旧操作菜单仅兼容展示，可删除，不再提供新增或编辑。隐藏「菜单管理」后仍可直接访问 `/menus` 恢复。登录页显示系统名称和登录表单。

新增页面时，先在 `src/router/routes.tsx` 注册路由，再在 `src/router/pageRegistry.ts` 登记路径、名称、默认标识、图标、默认菜单标记及是否允许加入菜单。页面清单不入库、不自动显示在侧栏；管理员再到菜单管理页选择页面并保存菜单。登录、初始化、404 等非导航页面也登记在清单中，但不可作为菜单选择。

首页使用 Recharts 展示真实访问趋势和近 7 天请求日志聚合的接口来源、热门接口。没有日志时相应图表显示空状态；近 7 日活跃用户、用户总数及新增用户图表由服务端提供演示数据，并在页面标明，待业务用户模块接入。前台访问上报接口和浏览器去重工具见 `server/README.md`、`client/visitTracker.ts`。配置管理和请求日志的时间使用浏览器本地时区，格式为 `YYYY-MM-DD HH:mm:ss`。

接口文档页位于 `/api-docs`，按管理端、用户端/公共接口及业务模块展示当前服务端路由，包含请求参数、响应数据、鉴权和业务码，并支持分类与搜索。文档源位于 `src/pages/api-docs/apiCatalog.ts`；新增或修改接口时同步维护。页面已登记在路由与页面清单，侧栏入口由管理员在菜单管理中手动添加。

系统管理页另设“网站信息”区块，左右并排配置管理后台和未来前台的标签名称、系统名称及图标。点击图标选择入口会打开文件选择弹窗，可复用已有图片或在弹窗中上传，支持 PNG、JPG、WebP、ICO，最多 2 MiB。后台设置会同步到登录/初始化页、侧栏品牌和浏览器标签；站点配置由公开读取接口加载，前台项目可复用同一接口。后台内容页最大宽度统一为 1400px。
