# 保存上传设置

保存文件存储策略及本地/七牛云参数；切换策略不会迁移旧文件。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/upload-settings` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `strategy` | `'local' \| 'qiniu'` | 是 | 启用 `qiniu` 前必须具备完整的 `accessKey`、`secretKey`、`bucket`、`domain` |
| `localDomain` | `string` | 是 | 空串或 HTTPS / `//` 域名（不可带路径与参数） |
| `accessKey` | `string` | 是 | 最多 200 字符 |
| `secretKey` | `string` | 是 | 最多 200 字符；留空字符串表示保留已配置原值 |
| `bucket` | `string` | 是 | 最多 100 字符 |
| `root` | `string` | 是 | 最多 100 字符，仅字母、数字、`/`、`_`、`-` |
| `uploadUrl` | `string` | 是 | HTTPS URL |
| `domain` | `string` | 是 | 空串或 HTTPS / `//` 域名（不可带路径与参数） |

## 响应示例

返回脱敏后的最新上传设置（同 [getUploadSettings.md](getUploadSettings.md)，`msg: "上传设置已保存"`）。
