# 直接上传站点图标

以原始图片二进制流上传后台或前台站点图标（保留以兼容旧版直接上传流程）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/site-settings/:target/icon` |
| 鉴权 | 管理员 JWT |
| 限流 | 每分钟最多 20 次（按 IP） |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 路径参数与请求体

- 路径参数 `target`：`'admin' | 'client'`
- 请求头 `Content-Type`：仅限 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon`
- 请求体：原始图片二进制字节，最大 `2 MiB`（服务端校验文件头，拒绝 SVG）

## 响应示例

返回最新 `SiteSettingsData`（`msg: "图标已上传"`）。
