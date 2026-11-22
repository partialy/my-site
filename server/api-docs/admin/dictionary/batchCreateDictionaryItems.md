# 批量新增字典子项

在单个数据库事务内向指定字典类型批量新增 1–20 个子项，任一子项值冲突则整批回滚。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/dictionaries/:id/items/batch` |
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
| `items` | `Array<CreateDictionaryItemInput>` | 是 | 1–20 项，元素结构同 [createDictionaryItem.md](createDictionaryItem.md) |

## 响应示例

返回新建子项数组 `DictionaryItem[]`（`msg: "字典子项已批量创建"`）。

## 常见错误码

- `1009`（HTTP 404）：字典类型不存在。
- `1013`（HTTP 409）：子项 `value` 重复或已存在。
