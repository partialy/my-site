# 获取当前管理员

校验管理员 JWT 并返回当前登录管理员基本信息。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/auth/me` |
| 鉴权 | 管理员 JWT（`Authorization: Bearer <token>`） |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "id": 1,
    "username": "admin"
  },
  "success": true
}
```

## 常见错误码

- `1005` / `1006` / `1007`（HTTP 401）：未提供 Token、Token 无效或已过期。
