# 选择文件库图标

从文件库中选用已有图片作为后台或前台站点图标。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/site-settings/:target/icon-file` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数与请求体

- 路径参数 `target`：`'admin' | 'client'`
- 请求体 JSON：`{ "fileId": "<UUID>" }`（所选文件须未归档，类型为 PNG/JPEG/WebP/ICO 且不超过 `2 MiB`）

## 响应示例

返回最新 `SiteSettingsData`（`msg: "图标已设置"`）。
