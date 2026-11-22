# 管理员注册业务用户

管理员在后台手动注册业务用户，与公开注册共用账号格式与密码哈希逻辑（账号不区分大小写且唯一）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/users` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `account` | `string` | 是 | 3–32 位，字母开头，仅字母、数字和下划线 |
| `password` | `string` | 是 | 8–128 位 |
| `nickname` | `string` | 否 | 1–50 位；不传时默认使用 `account` |

## 响应示例

```json
{
  "code": 0,
  "msg": "用户已注册",
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

- `1011`（HTTP 409）：账号已存在。
