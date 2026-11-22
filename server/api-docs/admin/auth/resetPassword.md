# 重置管理员密码

使用服务端 `.env` 配置的 `SETUP_KEY` 重置唯一管理员的登录密码；重置成功后递增 `token_version`，使现有管理员 JWT 立即失效。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/auth/reset-password` |
| 鉴权 | 无需 JWT（需校验 `SETUP_KEY`） |
| 限流 | 按 IP 限制，15 分钟内最多失败 5 次（`NODE_ENV=development` 下关闭） |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `setupKey` | `string` | 是 | 非空，需匹配服务端 `.env` 中 `SETUP_KEY` |
| `newPassword` | `string` | 是 | 8–128 位 |

## 响应示例

```json
{
  "code": 0,
  "msg": "密码重置成功，请使用新密码登录",
  "data": null,
  "success": true
}
```

## 常见错误码

- `1001`（HTTP 400）：参数校验失败。
- `1002`（HTTP 403）：`setupKey` 初始化密钥错误。
- `1009`（HTTP 404）：管理员尚未初始化。
- `1012`（HTTP 429）：失败次数过多，触发限流。
