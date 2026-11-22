# 获取站点设置

获取项目名称、页脚版权、管理端与前台站点标识及图标、登录外观配置（供登录与初始化前读取，无需鉴权）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/site-settings` |
| 鉴权 | 无需鉴权 |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "projectName": "NodeBase",
    "copyright": "NodeBase Admin © 2026 · 可复制的轻量管理端基础框架",
    "admin": {
      "siteTitle": "NodeBase Admin",
      "systemName": "NodeBase Admin",
      "iconUrl": null
    },
    "client": {
      "siteTitle": "NodeBase Client",
      "systemName": "NodeBase Client",
      "iconUrl": null
    },
    "loginAppearance": {
      "backgroundMode": "solid",
      "solidColor": "#f4f7fc",
      "gradientStartColor": "#e9f0ff",
      "gradientEndColor": "#f8fafc",
      "gradientDirection": 135,
      "backgroundFileId": null,
      "backgroundUrl": null,
      "cardOpacity": 95
    }
  },
  "success": true
}
```
