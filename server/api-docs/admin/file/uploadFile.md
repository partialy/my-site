# 管理员本地上传文件

在本地存储策略下，直接上传原始文件字节并登记到文件库（七牛云策略下需使用公开 `/api/v1/uploads/prepare` + 直传 + `/complete` 流程）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/files` |
| 鉴权 | 管理员 JWT |
| 限流 | 每分钟最多 20 次（按 IP） |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求头与请求体

- 请求头 `Content-Type`：仅支持 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon`、`image/gif`、`application/pdf`
- 请求头 `X-File-Name`：经 `encodeURIComponent` 编码后的原始文件名（解码后 1–255 字符）
- 请求体：原始文件二进制字节，最大 `10 MiB`（服务端校验文件头签名，拒绝 SVG）

## 响应示例

```json
{
  "code": 0,
  "msg": "文件已上传",
  "data": {
    "id": "d7cc7734-a59c-488d-9ea9-602537b24c29",
    "name": "logo.png",
    "mimeType": "image/png",
    "size": 12480,
    "url": "/api/v1/files/d7cc7734-a59c-488d-9ea9-602537b24c29/content",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "archivedAt": null
  },
  "success": true
}
```
