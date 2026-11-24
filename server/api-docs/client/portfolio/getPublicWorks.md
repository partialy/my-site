# 分页获取公开作品列表

分页查询已发布（`status = 'published'`）的作品列表，按 `sort_order ASC, id ASC` 排序。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/works` |
| 鉴权 | 无需鉴权 |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | `>= 0` 整数，默认 `0` |
| `limit` | `number` | 否 | `1–100` 整数，默认 `20` |
| `search` | `string` | 否 | 关键词模糊匹配名称、标语、简介、技术栈，最多 120 字符 |
| `category` | `string` | 否 | 字典 `work_category` 分类编码 |
| `featuredOnly` | `string` | 否 | `'true' | 'false'`，为 `'true'` 时仅返回首页轮盘展示作品 |

## 响应示例

返回统一分页结构 `{ list, total, offset, limit, hasMore }`，每条包含 `uuid`、`slug`、`category`、`categoryLabel`、`platforms`、`metrics`、`highlights`、`techStack`、`releases` 等字段。
