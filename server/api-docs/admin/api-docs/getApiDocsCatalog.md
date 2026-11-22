# 获取接口文档目录

读取并解析服务端 `server/api-docs/index.md`，返回通用约定说明及按端、模块分组的接口目录结构；支持按关键词对名称、路径、方法、模块与正文做全文检索。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/api-docs` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `search` | `string` | 否 | 最多 100 字符，同时检索目录元信息及 `.md` 正文内容 |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "overviewMarkdown": "## 通用约定\n...",
    "total": 69,
    "groups": [
      {
        "audience": "admin",
        "module": "用户管理",
        "endpoints": [
          {
            "title": "分页查询业务用户",
            "method": "GET",
            "path": "/api/v1/admin/users",
            "auth": true,
            "authText": "管理员 JWT",
            "docPath": "admin/user/getUserList.md"
          }
        ]
      }
    ]
  },
  "success": true
}
```
