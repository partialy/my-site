# 创建初始管理员

仅在系统尚未初始化时创建唯一管理员账号，并在同一事务内写入项目名称及后台/前台站点名称。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/setup/admin` |
| 鉴权 | 无需鉴权（需 `SETUP_KEY`） |
| 限流 | 15 分钟内最多 5 次（按 IP） |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `username` | `string` | 是 | 3–32 位，仅字母、数字和下划线 |
| `password` | `string` | 是 | 8–128 位 |
| `setupKey` | `string` | 是 | 非空，需匹配服务端 `.env` 中 `SETUP_KEY` |
| `projectName` | `string` | 是 | 1–100 位，首尾去空格 |
| `siteSettings.admin.siteTitle` | `string` | 是 | 1–100 位，管理端浏览器标题 |
| `siteSettings.admin.systemName` | `string` | 是 | 1–100 位，管理端系统名称 |
| `siteSettings.client.siteTitle` | `string` | 是 | 1–100 位，前台浏览器标题 |
| `siteSettings.client.systemName` | `string` | 是 | 1–100 位，前台系统名称 |

## 响应示例

```json
{
  "code": 0,
  "msg": "管理员初始化成功",
  "data": {
    "id": 1,
    "username": "admin"
  },
  "success": true
}
```

## 常见错误码

- `1001`（HTTP 400）：参数校验失败。
- `1002`（HTTP 403）：`setupKey` 初始化密钥错误。
- `1003`（HTTP 409）：管理员已初始化，不可重复创建。
