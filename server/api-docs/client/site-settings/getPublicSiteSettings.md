# 获取公开站点设置

供前台应用与管理端登录页公开读取项目名称、版权信息、站点标题/系统名称/图标及登录外观配置。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/site-settings` |
| 鉴权 | 无需鉴权 |
| 成功状态码 | `200` |

## 响应示例

返回 `SiteSettingsData`（结构同 [admin/site-settings/getSiteSettings.md](../../admin/site-settings/getSiteSettings.md)）。
