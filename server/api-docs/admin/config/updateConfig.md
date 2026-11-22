# 修改普通配置

按原配置键更新配置内容（支持同时修改 `key` 键名），写库并刷新缓存。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/configs/:key` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数

| 参数 | 说明 |
| :--- | :--- |
| `key` | 原配置键（需 URL 编码） |

## 请求体（JSON）

同 [createConfig.md](createConfig.md)（请求体中的 `key` 可改为新键）。

## 响应示例

```json
{
  "code": 0,
  "msg": "配置已更新",
  "data": {
    "key": "contact.email",
    "name": "联系邮箱",
    "value": "hello@example.com",
    "enabled": true,
    "remark": "已更新",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:10:00.000Z"
  },
  "success": true
}
```

## 常见错误码

- `1009`（HTTP 404）：原配置不存在。
- `1010`（HTTP 409）：修改后的新键与其他配置冲突。
