# 新增字典类型

创建单个字典类型并刷新内存缓存；`code` 创建后不可修改。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/dictionaries` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `code` | `string` | 是 | 1–80 位，以字母开头，仅字母、数字、`_`、`-` |
| `name` | `string` | 是 | 1–100 位 |
| `remark` | `string` | 是 | 最多 500 位 |
| `isPublic` | `boolean` | 是 | 是否允许公开字典接口读取 |
| `enabled` | `boolean` | 是 | 是否启用 |

## 响应示例

```json
{
  "code": 0,
  "msg": "字典类型已创建",
  "data": {
    "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
    "code": "order_status",
    "name": "订单状态",
    "remark": "",
    "isPublic": true,
    "enabled": true,
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:00:00.000Z",
    "items": []
  },
  "success": true
}
```

## 常见错误码

- `1013`（HTTP 409）：字典类型标识已存在。
