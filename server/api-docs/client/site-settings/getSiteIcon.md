# 获取站点图标二进制

公开读取管理端或前台的站点图标图片流（允许跨域加载）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/site-settings/:target/icon` |
| 鉴权 | 无需鉴权 |
| 响应类型 | 图片二进制流（`Cross-Origin-Resource-Policy: cross-origin`、`Cache-Control: no-cache`） |
| 成功状态码 | `200` |

## 请求参数

- 路径参数 `target`：`'admin' | 'client'`
- Query 参数 `v`（可选）：版本号，用于前端缓存区分

## 常见错误码

- `1009`（HTTP 404）：目标尚未配置图标或文件不存在。
