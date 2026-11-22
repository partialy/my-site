# 新增字典子项

向指定字典类型添加单个子项并刷新内存缓存；`value` 创建后不可修改。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/dictionaries/:id/items` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 路径参数

| 参数 | 说明 |
| :--- | :--- |
| `id` | 字典类型 `uuid`（32 位无连字符） |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `label` | `string` | 是 | 1–100 位，展示名称 |
| `value` | `string` | 是 | 1–80 位，仅字母、数字、`_`、`-` |
| `sort` | `number` | 是 | 整数，`0`–`1000000` |
| `enabled` | `boolean` | 是 | 是否启用 |
| `color` | `string` | 是 | `'default' \| 'blue' \| 'green' \| 'orange' \| 'red' \| 'purple' \| 'cyan' \| 'gold'` |

## 响应示例

```json
{
  "code": 0,
  "msg": "字典子项已创建",
  "data": {
    "uuid": "1c4f9b2e83c04f85a62b90a1d4f6e321",
    "label": "待支付",
    "value": "pending",
    "sort": 10,
    "enabled": true,
    "color": "orange",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:00:00.000Z"
  },
  "success": true
}
```

## 常见错误码

- `1009`（HTTP 404）：字典类型不存在。
- `1013`（HTTP 409）：该类型下 `value` 已存在。
