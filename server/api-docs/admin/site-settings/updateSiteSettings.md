# 保存站点基础信息

保存项目名称、管理端页脚版权信息以及后台/前台各自的标签标题和系统名称。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/site-settings` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `projectName` | `string` | 否 | 1–100 位 |
| `copyright` | `string` | 否 | 1–200 位（不传则保留原值） |
| `admin.siteTitle` | `string` | 是 | 1–100 位 |
| `admin.systemName` | `string` | 是 | 1–100 位 |
| `client.siteTitle` | `string` | 是 | 1–100 位 |
| `client.systemName` | `string` | 是 | 1–100 位 |

## 响应示例

返回最新 `SiteSettingsData`（同 [getSiteSettings.md](getSiteSettings.md)，`msg: "站点配置已保存"`）。
