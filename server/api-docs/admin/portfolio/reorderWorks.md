# 批量调整作品排序

批量更新作品的 `sortOrder` 排序权重及可选的首页轮盘展示开关 `featuredHome`。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/works/reorder` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

```json
{
  "items": [
    { "uuid": "1a2b3c4d5e6f4a7b8c9d0e1f2a3b4c5d", "sortOrder": 10, "featuredHome": true }
  ]
}
```
