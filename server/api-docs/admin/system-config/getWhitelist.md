# 获取请求日志白名单

全量返回请求日志白名单规则列表（非增长式配置，不分页）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/system-config/whitelist` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "id": "a1b2c3d4",
      "name": "站点配置",
      "type": "exact",
      "path": "/api/v1/site-settings",
      "remark": "",
      "createdAt": "2026-10-20T08:00:00.000Z",
      "updatedAt": "2026-10-20T08:00:00.000Z"
    }
  ],
  "success": true
}
```
