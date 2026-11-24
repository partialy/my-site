# 分页查询作品列表

管理员分页查询作品列表，支持关键词、分类、发布状态与首页展示筛选。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/works` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | `>= 0` 整数，默认 `0` |
| `limit` | `number` | 否 | `1–100` 整数，默认 `20` |
| `search` | `string` | 否 | 模糊匹配名称、英文名、Slug、标语或技术栈 |
| `category` | `string` | 否 | `work_category` 字典值 |
| `status` | `string` | 否 | `'draft' | 'published'` |
| `featuredHome` | `string` | 否 | `'true' | 'false'` |
