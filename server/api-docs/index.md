# NodeBase 服务端接口文档索引

本目录按**调用端（`admin/`、`client/`）**与**业务模块**组织服务端所有 HTTP 接口的详细文档。增删改任何接口时，必须同步更新本索引及对应模块文档（管理端 `/api-docs` 与白名单接口选择器会自动读取本目录）。

## 通用约定

- **接口前缀**：管理端接口 `/api/v1/admin/**`，客户端与公开接口 `/api/v1/**`（健康检查探针 `/health` 除外）。
- **鉴权方式**：请求头携带 `Authorization: Bearer <token>`。管理员 JWT 与业务用户 JWT 密钥声明不同，**不可混用**。
- **统一响应结构**：
  - 成功：`{ "code": 0, "msg": "成功", "data": <TData>, "success": true }`
  - 参数校验失败：`{ "code": 1001, "msg": "...", "data": { "fieldErrors": { "<field>": ["..."] } }, "success": false }`
  - 业务或系统错误：`{ "code": <FailureCode>, "msg": "...", "data": null, "success": false }`
- **统一分页标准**：
  - Query 参数：`offset`（默认 `0`，`>= 0` 整数）与 `limit`（默认 `20`，`1–100` 整数），不兼容 `page` / `pageSize`。
  - 响应 `data`：`{ "list": [], "total": 0, "offset": 0, "limit": 20, "hasMore": false }`（`hasMore = offset + list.length < total`）。
- **常用业务码**：`0` 成功、`-1` 通用失败、`1001` 参数校验错误、`1002` 初始化密钥错误、`1003` 已初始化、`1004` 账号或密码错误、`1005` 未提供 Token、`1006` Token 无效、`1007` Token 过期、`1008` 原密码错误、`1009` 资源不存在、`1010` 配置键已存在、`1011` 用户账号已存在、`1012` 请求过于频繁、`1013` 字典标识或值已存在、`1014` 文件正被引用无法删除。

---

## 管理端接口（`admin/`）

### 初始化与认证（`admin/auth`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 查询初始化状态 | `GET` | `/api/v1/admin/setup/status` | 否 | [getSetupStatus.md](admin/auth/getSetupStatus.md) |
| 创建初始管理员 | `POST` | `/api/v1/admin/setup/admin` | 否 | [createInitialAdmin.md](admin/auth/createInitialAdmin.md) |
| 管理员登录 | `POST` | `/api/v1/admin/auth/login` | 否 | [login.md](admin/auth/login.md) |
| 获取当前管理员 | `GET` | `/api/v1/admin/auth/me` | 管理员 JWT | [getCurrentAdmin.md](admin/auth/getCurrentAdmin.md) |
| 修改管理员密码 | `PUT` | `/api/v1/admin/auth/password` | 管理员 JWT | [changePassword.md](admin/auth/changePassword.md) |
| 重置管理员密码 | `POST` | `/api/v1/admin/auth/reset-password` | 否（`SETUP_KEY`） | [resetPassword.md](admin/auth/resetPassword.md) |

### 系统管理（`admin/system-config`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取系统日志配置 | `GET` | `/api/v1/admin/system-config` | 管理员 JWT | [getSystemConfig.md](admin/system-config/getSystemConfig.md) |
| 保存系统日志配置 | `PUT` | `/api/v1/admin/system-config` | 管理员 JWT | [updateSystemConfig.md](admin/system-config/updateSystemConfig.md) |
| 获取请求日志白名单 | `GET` | `/api/v1/admin/system-config/whitelist` | 管理员 JWT | [getWhitelist.md](admin/system-config/getWhitelist.md) |
| 新增白名单规则 | `POST` | `/api/v1/admin/system-config/whitelist` | 管理员 JWT | [createWhitelistRule.md](admin/system-config/createWhitelistRule.md) |
| 修改白名单规则 | `PUT` | `/api/v1/admin/system-config/whitelist/:id` | 管理员 JWT | [updateWhitelistRule.md](admin/system-config/updateWhitelistRule.md) |
| 删除白名单规则 | `DELETE` | `/api/v1/admin/system-config/whitelist/:id` | 管理员 JWT | [deleteWhitelistRule.md](admin/system-config/deleteWhitelistRule.md) |

### 普通配置管理（`admin/config`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取普通配置列表 | `GET` | `/api/v1/admin/configs` | 管理员 JWT | [getConfigList.md](admin/config/getConfigList.md) |
| 新增普通配置 | `POST` | `/api/v1/admin/configs` | 管理员 JWT | [createConfig.md](admin/config/createConfig.md) |
| 修改普通配置 | `PUT` | `/api/v1/admin/configs/:key` | 管理员 JWT | [updateConfig.md](admin/config/updateConfig.md) |
| 删除普通配置 | `DELETE` | `/api/v1/admin/configs/:key` | 管理员 JWT | [deleteConfig.md](admin/config/deleteConfig.md) |

### 数据字典（`admin/dictionary`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取字典类型与子项列表 | `GET` | `/api/v1/admin/dictionaries` | 管理员 JWT | [getDictionaryList.md](admin/dictionary/getDictionaryList.md) |
| 批量获取后台字典选项 | `GET` | `/api/v1/admin/dictionaries/options` | 管理员 JWT | [getDictionaryOptions.md](admin/dictionary/getDictionaryOptions.md) |
| 新增字典类型 | `POST` | `/api/v1/admin/dictionaries` | 管理员 JWT | [createDictionaryType.md](admin/dictionary/createDictionaryType.md) |
| 批量新增字典类型 | `POST` | `/api/v1/admin/dictionaries/batch` | 管理员 JWT | [batchCreateDictionaryTypes.md](admin/dictionary/batchCreateDictionaryTypes.md) |
| 修改字典类型 | `PUT` | `/api/v1/admin/dictionaries/:id` | 管理员 JWT | [updateDictionaryType.md](admin/dictionary/updateDictionaryType.md) |
| 新增字典子项 | `POST` | `/api/v1/admin/dictionaries/:id/items` | 管理员 JWT | [createDictionaryItem.md](admin/dictionary/createDictionaryItem.md) |
| 批量新增字典子项 | `POST` | `/api/v1/admin/dictionaries/:id/items/batch` | 管理员 JWT | [batchCreateDictionaryItems.md](admin/dictionary/batchCreateDictionaryItems.md) |
| 修改字典子项 | `PUT` | `/api/v1/admin/dictionaries/:id/items/:itemId` | 管理员 JWT | [updateDictionaryItem.md](admin/dictionary/updateDictionaryItem.md) |

### 菜单管理（`admin/menu`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取菜单列表 | `GET` | `/api/v1/admin/menus` | 管理员 JWT | [getMenuList.md](admin/menu/getMenuList.md) |
| 整体保存菜单 | `PUT` | `/api/v1/admin/menus` | 管理员 JWT | [replaceMenus.md](admin/menu/replaceMenus.md) |

### 站点设置（`admin/site-settings`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取站点设置 | `GET` | `/api/v1/admin/site-settings` | 否 | [getSiteSettings.md](admin/site-settings/getSiteSettings.md) |
| 保存站点基础信息 | `PUT` | `/api/v1/admin/site-settings` | 管理员 JWT | [updateSiteSettings.md](admin/site-settings/updateSiteSettings.md) |
| 保存登录外观 | `PUT` | `/api/v1/admin/site-settings/login-appearance` | 管理员 JWT | [updateLoginAppearance.md](admin/site-settings/updateLoginAppearance.md) |
| 直接上传站点图标 | `PUT` | `/api/v1/admin/site-settings/:target/icon` | 管理员 JWT | [uploadSiteIcon.md](admin/site-settings/uploadSiteIcon.md) |
| 选择文件库图标 | `PUT` | `/api/v1/admin/site-settings/:target/icon-file` | 管理员 JWT | [selectSiteIconFile.md](admin/site-settings/selectSiteIconFile.md) |
| 移除站点图标 | `DELETE` | `/api/v1/admin/site-settings/:target/icon` | 管理员 JWT | [deleteSiteIcon.md](admin/site-settings/deleteSiteIcon.md) |

### 请求日志（`admin/request-log`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 分页查询请求日志 | `GET` | `/api/v1/admin/request-logs` | 管理员 JWT | [getRequestLogList.md](admin/request-log/getRequestLogList.md) |
| 清理请求日志 | `DELETE` | `/api/v1/admin/request-logs` | 管理员 JWT | [cleanupRequestLogs.md](admin/request-log/cleanupRequestLogs.md) |

### 操作日志（`admin/operation-log`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 分页查询操作审计日志 | `GET` | `/api/v1/admin/operation-logs` | 管理员 JWT | [getOperationLogList.md](admin/operation-log/getOperationLogList.md) |

### 运行状态与备份（`admin/system-status`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取服务器状态 | `GET` | `/api/v1/admin/system-status` | 管理员 JWT | [getSystemStatus.md](admin/system-status/getSystemStatus.md) |
| 下载 SQLite 数据库备份 | `POST` | `/api/v1/admin/backups/database` | 管理员 JWT | [downloadDatabaseBackup.md](admin/system-status/downloadDatabaseBackup.md) |

### 首页统计（`admin/dashboard`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取首页统计数据 | `GET` | `/api/v1/admin/home` | 管理员 JWT | [getHomeDashboard.md](admin/dashboard/getHomeDashboard.md) |

### 用户管理（`admin/user`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 分页查询业务用户 | `GET` | `/api/v1/admin/users` | 管理员 JWT | [getUserList.md](admin/user/getUserList.md) |
| 管理员注册业务用户 | `POST` | `/api/v1/admin/users` | 管理员 JWT | [createUser.md](admin/user/createUser.md) |
| 查看业务用户详情 | `GET` | `/api/v1/admin/users/:id` | 管理员 JWT | [getUserDetail.md](admin/user/getUserDetail.md) |
| 编辑业务用户资料 | `PUT` | `/api/v1/admin/users/:id/profile` | 管理员 JWT | [updateUserProfile.md](admin/user/updateUserProfile.md) |
| 禁用或启用业务用户 | `PUT` | `/api/v1/admin/users/:id/status` | 管理员 JWT | [updateUserStatus.md](admin/user/updateUserStatus.md) |

### 访问日志（`admin/visit`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 分页查询访问日志 | `GET` | `/api/v1/admin/visits` | 管理员 JWT | [getVisitLogList.md](admin/visit/getVisitLogList.md) |

### 文件管理与上传设置（`admin/file`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 读取上传设置 | `GET` | `/api/v1/admin/upload-settings` | 管理员 JWT | [getUploadSettings.md](admin/file/getUploadSettings.md) |
| 保存上传设置 | `PUT` | `/api/v1/admin/upload-settings` | 管理员 JWT | [updateUploadSettings.md](admin/file/updateUploadSettings.md) |
| 分页查询文件列表 | `GET` | `/api/v1/admin/files` | 管理员 JWT | [getFileList.md](admin/file/getFileList.md) |
| 管理员本地上传文件 | `POST` | `/api/v1/admin/files` | 管理员 JWT | [uploadFile.md](admin/file/uploadFile.md) |
| 归档文件 | `DELETE` | `/api/v1/admin/files/:id` | 管理员 JWT | [archiveFile.md](admin/file/archiveFile.md) |
| 恢复归档文件 | `PUT` | `/api/v1/admin/files/:id/restore` | 管理员 JWT | [restoreFile.md](admin/file/restoreFile.md) |
| 永久删除文件 | `DELETE` | `/api/v1/admin/files/:id/permanent` | 管理员 JWT | [deleteFilePermanently.md](admin/file/deleteFilePermanently.md) |

### 支付设置（`admin/payment-settings`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 读取支付宝设置 | `GET` | `/api/v1/admin/payment-settings/alipay` | 管理员 JWT | [getAlipaySettings.md](admin/payment-settings/getAlipaySettings.md) |
| 保存支付宝设置 | `PUT` | `/api/v1/admin/payment-settings/alipay` | 管理员 JWT | [updateAlipaySettings.md](admin/payment-settings/updateAlipaySettings.md) |
| 读取微信支付设置 | `GET` | `/api/v1/admin/payment-settings/wechat` | 管理员 JWT | [getWechatPaySettings.md](admin/payment-settings/getWechatPaySettings.md) |
| 保存微信支付设置 | `PUT` | `/api/v1/admin/payment-settings/wechat` | 管理员 JWT | [updateWechatPaySettings.md](admin/payment-settings/updateWechatPaySettings.md) |

### 接口文档（`admin/api-docs`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取接口文档目录 | `GET` | `/api/v1/admin/api-docs` | 管理员 JWT | [getApiDocsCatalog.md](admin/api-docs/getApiDocsCatalog.md) |
| 获取单个接口文档详情 | `GET` | `/api/v1/admin/api-docs/detail` | 管理员 JWT | [getApiDocDetail.md](admin/api-docs/getApiDocDetail.md) |
| 导出完整接口文档 | `GET` | `/api/v1/admin/api-docs/export` | 管理员 JWT | [exportApiDocs.md](admin/api-docs/exportApiDocs.md) |

---

## 客户端 / 公开接口（`client/`）

### 文件上传（`client/upload`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 准备文件上传 | `POST` | `/api/v1/uploads/prepare` | 否 | [prepareUpload.md](client/upload/prepareUpload.md) |
| 上传本地文件 | `POST` | `/api/v1/uploads/local` | 否 | [uploadLocalFile.md](client/upload/uploadLocalFile.md) |
| 登记七牛直传文件 | `POST` | `/api/v1/uploads/complete` | 否 | [completeUpload.md](client/upload/completeUpload.md) |

### 站点信息与图标（`client/site-settings`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 获取公开站点设置 | `GET` | `/api/v1/site-settings` | 否 | [getPublicSiteSettings.md](client/site-settings/getPublicSiteSettings.md) |
| 获取站点图标二进制 | `GET` | `/api/v1/site-settings/:target/icon` | 否 | [getSiteIcon.md](client/site-settings/getSiteIcon.md) |

### 数据字典（`client/dictionary`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 批量获取公开字典选项 | `GET` | `/api/v1/dictionaries` | 否 | [getPublicDictionaryOptions.md](client/dictionary/getPublicDictionaryOptions.md) |

### 文件访问（`client/file`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 读取文件内容 | `GET` | `/api/v1/files/:id/content` | 否 | [getFileContent.md](client/file/getFileContent.md) |

### 访问统计（`client/visit`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 上报页面访问 | `POST` | `/api/v1/visits` | 否 | [reportVisit.md](client/visit/reportVisit.md) |

### 业务用户（`client/user`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 注册业务用户 | `POST` | `/api/v1/users/register` | 否 | [register.md](client/user/register.md) |
| 业务用户登录 | `POST` | `/api/v1/users/login` | 否 | [login.md](client/user/login.md) |
| 获取当前业务用户 | `GET` | `/api/v1/users/me` | 业务用户 JWT | [getCurrentUser.md](client/user/getCurrentUser.md) |

### 健康检查（`client/health`）

| 接口名称 | 方法 | 路径 | 鉴权 | 文档 |
| :--- | :--- | :--- | :--- | :--- |
| 服务就绪探针 | `GET` | `/health` | 否 | [healthCheck.md](client/health/healthCheck.md) |
