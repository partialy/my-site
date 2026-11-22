# 获取字典类型与子项列表

从内存缓存全量返回所有字典类型及其子项（含已停用项，非增长式配置，不分页）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/dictionaries` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
      "code": "order_status",
      "name": "订单状态",
      "remark": "示例业务字典",
      "isPublic": true,
      "enabled": true,
      "createdAt": "2026-10-20T08:00:00.000Z",
      "updatedAt": "2026-10-20T08:00:00.000Z",
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
  ],
  "success": true
}
```
