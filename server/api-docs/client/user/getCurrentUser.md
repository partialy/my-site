# 获取当前业务用户

校验业务用户 JWT 并返回当前登录业务用户资料（同时按 UTC 日记录 `user_activity`）。用户 JWT 与管理员 JWT 不可混用。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/users/me` |
| 鉴权 | 业务用户 JWT（`Authorization: Bearer <token>`） |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
    "account": "example_user",
    "nickname": "示例用户",
    "avatar": null,
    "status": "active",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:00:00.000Z"
  },
  "success": true
}
```

## 常见错误码

- `1005` / `1006` / `1007`（HTTP 401）：未提供 Token、Token 无效（含用户被禁用后撤销）或已过期。
