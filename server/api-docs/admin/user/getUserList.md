# 分页查询业务用户

分页筛选并查询已注册的业务用户列表。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/users` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | 整数 `>= 0`，默认 `0` |
| `limit` | `number` | 否 | 整数 `1–100`，默认 `20` |
| `search` | `string` | 否 | 最多 100 字符，模糊匹配账号或昵称 |
| `status` | `'active' \| 'disabled'` | 否 | 账号状态筛选 |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
        "account": "example_user",
        "nickname": "示例用户",
        "avatar": null,
        "status": "active",
        "createdAt": "2026-10-20T08:00:00.000Z",
        "updatedAt": "2026-10-20T08:00:00.000Z"
      }
    ],
    "total": 1,
    "offset": 0,
    "limit": 20,
    "hasMore": false
  },
  "success": true
}
```
