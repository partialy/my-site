# 业务用户登录

校验业务用户账号与密码并签发业务用户 JWT（同时按 UTC 日记录 `user_activity`）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/users/login` |
| 鉴权 | 无需鉴权 |
| 限流 | 按 IP 与账号组合限制，15 分钟内最多失败 5 次 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `account` | `string` | 是 | 非空 |
| `password` | `string` | 是 | 非空 |

## 响应示例

```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "<user-jwt-token>",
    "tokenType": "Bearer",
    "expiresIn": 604800,
    "user": {
      "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
      "account": "example_user",
      "nickname": "示例用户",
      "avatar": null,
      "status": "active",
      "createdAt": "2026-10-20T08:00:00.000Z",
      "updatedAt": "2026-10-20T08:00:00.000Z"
    }
  },
  "success": true
}
```

## 常见错误码

- `1004`（HTTP 401）：账号或密码错误。
- `1006`（HTTP 403）：账号已被禁用。
- `1012`（HTTP 429）：失败次数过多，触发限流。
