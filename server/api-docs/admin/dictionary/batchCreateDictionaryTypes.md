# 批量新增字典类型

在单个数据库事务内批量创建 1–20 个字典类型，任一标识冲突则整批回滚。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/dictionaries/batch` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `items` | `Array<CreateDictionaryInput>` | 是 | 1–20 项，元素结构同 [createDictionaryType.md](createDictionaryType.md) |

## 响应示例

```json
{
  "code": 0,
  "msg": "字典类型已批量创建",
  "data": [
    {
      "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
      "code": "order_status",
      "name": "订单状态",
      "remark": "",
      "isPublic": true,
      "enabled": true,
      "createdAt": "2026-10-20T08:00:00.000Z",
      "updatedAt": "2026-10-20T08:00:00.000Z",
      "items": []
    }
  ],
  "success": true
}
```

## 常见错误码

- `1013`（HTTP 409）：批量内或与已有字典类型 `code` 冲突。
