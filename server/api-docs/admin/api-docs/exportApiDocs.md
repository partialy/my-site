# 导出完整接口文档

将 `server/api-docs/index.md` 中的通用约定与全部已索引接口文档按端和模块汇总合并为单份 Markdown 文本返回。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/api-docs/export` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "filename": "NodeBase-接口文档.md",
    "content": "# NodeBase 服务端接口文档\n..."
  },
  "success": true
}
```
