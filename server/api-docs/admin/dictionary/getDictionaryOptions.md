# 批量获取后台字典选项

按逗号分隔的类型标识批量读取管理端可用选项；仅返回启用类型与启用子项，可读取非公开的后台字典。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/dictionaries/options` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `codes` | `string` | 是 | 逗号分隔的字典标识，1–30 个，每项须符合 `^[A-Za-z][A-Za-z0-9_-]*$`（1–80 位） |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "order_status": {
      "code": "order_status",
      "name": "订单状态",
      "items": [
        {
          "uuid": "1c4f9b2e83c04f85a62b90a1d4f6e321",
          "label": "待支付",
          "value": "pending",
          "sort": 10,
          "enabled": true,
          "color": "orange",
          "createdAt": "2026-10-20T08:00:00.000Z",
          "updatedAt": "2026-10-20T08:00:00.000Z"
        }
      ]
    }
  },
  "success": true
}
```
