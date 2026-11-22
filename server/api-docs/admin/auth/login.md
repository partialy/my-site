# 管理员登录

校验管理员用户名与密码，签发管理员 JWT。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/auth/login` |
| 鉴权 | 无需鉴权 |
| 限流 | 按 IP 与账号组合限制，15 分钟内最多失败 5 次 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `username` | `string` | 是 | 3–32 位，仅字母、数字和下划线 |
| `password` | `string` | 是 | 8–128 位 |

## 响应示例

```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "<jwt-token>",
    "tokenType": "Bearer",
    "expiresIn": 43200,
    "admin": {
      "id": 1,
      "username": "admin"
    }
  },
  "success": true
}
```

## 常见错误码

- `1004`（HTTP 401）：账号或密码错误。
- `1012`（HTTP 429）：失败次数过多，触发限流。
