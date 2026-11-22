# 修改字典子项

修改指定字典子项的展示名称、排序、启用状态与徽章颜色（`value` 不可修改，停用可保留历史值）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/dictionaries/:id/items/:itemId` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数

| 参数 | 说明 |
| :--- | :--- |
| `id` | 字典类型 `uuid`（32 位无连字符） |
| `itemId` | 字典子项 `uuid`（32 位无连字符） |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `label` | `string` | 是 | 1–100 位 |
| `sort` | `number` | 是 | 整数，`0`–`1000000` |
| `enabled` | `boolean` | 是 | 是否启用 |
| `color` | `string` | 是 | `'default' \| 'blue' \| 'green' \| 'orange' \| 'red' \| 'purple' \| 'cyan' \| 'gold'` |

## 响应示例

返回更新后的 `DictionaryItem`（`msg: "字典子项已更新"`）。

## 常见错误码

- `1009`（HTTP 404）：字典类型或子项不存在。
