# 获取普通配置列表

全量返回普通动态配置列表（`config` 表，非增长式配置，不分页）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/configs` |
| 鉴权 | 管理员 JWT |
| 请求日志 | 不记录请求/响应内容，避免配置值泄露 |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "key": "contact.email",
      "name": "联系邮箱",
      "value": "support@example.com",
      "enabled": true,
      "remark": "页脚展示",
      "createdAt": "2026-10-20T08:00:00.000Z",
      "updatedAt": "2026-10-20T08:00:00.000Z"
    }
  ],
  "success": true
}
```
