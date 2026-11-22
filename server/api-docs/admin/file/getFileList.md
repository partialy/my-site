# 分页查询文件列表

分页筛选并查询文件库中的文件记录，支持文件名搜索、MIME 过滤、归档状态筛选及排序。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/files` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | 整数 `>= 0`，默认 `0` |
| `limit` | `number` | 否 | 整数 `1–100`，默认 `20` |
| `search` | `string` | 否 | 最多 200 字符，文件名匹配 |
| `mimeTypes` | `string` | 否 | 逗号分隔 MIME 类型（仅限 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon`、`image/gif`、`application/pdf`） |
| `status` | `'active' \| 'archived' \| 'all'` | 否 | 默认 `active`（文件管理页传 `all`，选择器传 `active`） |
| `sortBy` | `'createdAt' \| 'size'` | 否 | 默认 `createdAt` |
| `sortOrder` | `'asc' \| 'desc'` | 否 | 默认 `desc` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": "d7cc7734-a59c-488d-9ea9-602537b24c29",
        "name": "logo.png",
        "mimeType": "image/png",
        "size": 12480,
        "url": "https://cdn.example.com/project/20261020/d7cc7734-a59c-488d-9ea9-602537b24c29.png",
        "createdAt": "2026-10-20T08:00:00.000Z",
        "archivedAt": null
      }
    ],
    "total": 1,
    "offset": 0,
    "limit": 20,
    "hasMore": false
  },
  "success": true
}
```
