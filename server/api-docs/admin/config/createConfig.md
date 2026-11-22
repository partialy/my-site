# 新增普通配置

创建一条普通动态配置并立即刷新内存缓存。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/configs` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `key` | `string` | 是 | 1–100 位，以字母开头，支持字母、数字、`_`、`.`、`:`、`-` |
| `name` | `string` | 是 | 1–100 位 |
| `value` | `string` | 是 | 最多 65535 字符（字符串形式存储/编辑） |
| `enabled` | `boolean` | 是 | 是否启用；禁用时 `ConfigManager.get()` 返回默认值 |
| `remark` | `string` | 是 | 最多 500 字符 |

## 响应示例

```json
{
  "code": 0,
  "msg": "配置已创建",
  "data": {
    "key": "contact.email",
    "name": "联系邮箱",
    "value": "support@example.com",
    "enabled": true,
    "remark": "页脚展示",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:00:00.000Z"
  },
  "success": true
}
```

## 常见错误码

- `1010`（HTTP 409）：配置键已存在。
