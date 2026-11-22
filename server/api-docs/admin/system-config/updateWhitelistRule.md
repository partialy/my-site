# 修改白名单规则

按规则 ID 修改已有白名单规则。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/system-config/whitelist/:id` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数

| 参数 | 说明 |
| :--- | :--- |
| `id` | 白名单规则 ID |

## 请求体（JSON）

同 [createWhitelistRule.md](createWhitelistRule.md)。

## 响应示例

```json
{
  "code": 0,
  "msg": "白名单规则已更新",
  "data": {
    "id": "a1b2c3d4",
    "name": "登录接口",
    "type": "exact",
    "path": "/api/v1/users/login",
    "remark": "已更新备注",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:10:00.000Z"
  },
  "success": true
}
```

## 常见错误码

- `1009`（HTTP 404）：白名单规则不存在。
