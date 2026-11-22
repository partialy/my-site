# 移除站点图标

清空后台或前台当前配置的站点图标文件引用及本地旧版图标文件。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `DELETE` |
| 路径 | `/api/v1/admin/site-settings/:target/icon` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数

- `target`：`'admin' | 'client'`

## 响应示例

返回最新 `SiteSettingsData`（其中对应 `iconUrl` 为 `null`，`msg: "图标已删除"`）。
