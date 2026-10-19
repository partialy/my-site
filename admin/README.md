# NodeBase Admin

React + TypeScript + React Router + Ant Design 单管理员后台。直接对接同仓库 server/，不提供本地模拟账号或模拟接口。

## 本地启动

1. 在 server/ 根据 .env.example 创建 .env，配置 JWT_SECRET 与 SETUP_KEY，然后运行 npm install、npm run dev。
2. 在 admin/ 运行 npm install、npm run dev，访问 http://localhost:5173/。
3. 首次访问会从 GET /api/v1/setup/status 判断是否已有管理员。若没有，进入初始化页；初始化密钥填写 server/.env 中的 SETUP_KEY。初始化成功后使用新账号登录。

admin/.env.example 给出开发代理配置。VITE_API_BASE_URL 默认 /api/v1；SERVER_PROXY_TARGET 默认 http://127.0.0.1:3000。Vite 开发服务器会将 /api 请求代理到 server，生产部署则需要网关将 /api/v1 转发到 server，且 SPA 路由回退到 index.html。

管理员密码与密钥不写入前端构建产物。JWT 存放在当前标签页的 sessionStorage；退出登录清理本地 Token，修改密码会由 server 使旧 Token 失效。

## 命令

- npm run dev：启动开发服务器。
- npm run typecheck：TypeScript 类型检查。
- npm run build：构建生产文件。
- npm run preview：预览构建文件；预览环境也需配置 /api/v1 的反向代理才能调用 server。

## 接口

所有接口使用 /api/v1 前缀，响应格式为 {code, msg, data, success}。code=0 为成功，-1 为通用失败，其余数字码表示明确的业务错误。admin/src/api/ 集中处理请求、响应数据校验及业务码；admin/src/auth/ 管理会话，页面不直接拼接 Token。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | /api/v1/setup/status | 获取初始化状态 |
| POST | /api/v1/setup/admin | 创建唯一管理员 |
| POST | /api/v1/auth/login | 登录并获取 JWT |
| GET | /api/v1/auth/me | 校验会话并读取管理员 |
| PUT | /api/v1/auth/password | 修改密码 |
| GET、PUT | /api/v1/system-config | 查看和保存系统日志配置 |
| GET、POST | /api/v1/system-config/whitelist | 查询、添加请求日志白名单 |
| PUT、DELETE | /api/v1/system-config/whitelist/:id | 修改、删除白名单规则 |
| GET、POST | /api/v1/configs | 查询、新增普通配置 |
| PUT、DELETE | /api/v1/configs/:key | 修改、删除普通配置 |
| GET、PUT | /api/v1/site-settings | 读取和修改后台、前台网站名称 |
| GET、PUT、DELETE | /api/v1/site-settings/:target/icon | 读取、上传、移除系统图标 |

服务端 500 或网络故障不会清理已保存的 Token，界面会提示重试；只有 1005、1006、1007 会按会话失效处理。控制台不展示预设业务统计，具体项目可接入真实业务数据。

系统管理页位于 `/system-config`，可从下拉框选择请求日志记录模式（关闭、全部、白名单）、管理白名单规则，以及设置控制台日志开关和输出模板。模板变量显示中文名称，点击复制变量文本。

配置管理页位于 `/configs`，通过表格和弹窗维护 `config` 表中的名称、键、值、启用状态及备注。所有设置均通过上述真实服务端接口读写。

系统管理页另设“网站信息”区块，左右并排配置管理后台和未来前台的标签名称、系统名称及图标。图标文件由 server 托管，支持 PNG、JPG、WebP、ICO，最多 2 MiB。后台设置会同步到登录/初始化页、侧栏品牌和浏览器标签；站点配置由公开读取接口加载，前台项目可复用同一接口。后台内容页最大宽度统一为 1400px。
