# 获取单个接口文档详情

按目录中的 `docPath` 读取对应 `.md` 接口文档的元信息与原始 Markdown 正文（严格校验相对路径与索引白名单，防止路径穿越）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/api-docs/detail` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `docPath` | `string` | 是 | 1–260 位，须为 `index.md` 已索引的相对 `.md` 路径，例如 `admin/user/getUserList.md` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "audience": "admin",
    "module": "用户管理",
    "title": "分页查询业务用户",
    "method": "GET",
    "path": "/api/v1/admin/users",
    "auth": true,
    "authText": "管理员 JWT",
    "docPath": "admin/user/getUserList.md",
    "content": "# 分页查询业务用户\n..."
  },
  "success": true
}
```

## 常见错误码

- `1001`（HTTP 400）：文档路径格式无效或越界。
- `1009`（HTTP 404）：指定接口文档不在索引中或文件不存在。
