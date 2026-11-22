# 准备文件上传

前端上传第一步：查询当前存储策略；本地策略忽略请求体并返回 `strategy: "local"`，七牛云策略校验文件元信息并签发精确 `objectKey` 的上传凭证。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/uploads/prepare` |
| 鉴权 | 无需鉴权（公开接口，可由前端模板 `uploadFile.ts` 调用） |
| 限流 | 每分钟最多 20 次（按 IP） |
| 成功状态码 | `200` |

## 请求体（JSON，七牛云策略下必填）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 是（七牛） | 1–255 位 |
| `mimeType` | `string` | 是（七牛） | `'image/png' \| 'image/jpeg' \| 'image/webp' \| 'image/x-icon' \| 'image/gif' \| 'application/pdf'` |
| `size` | `number` | 是（七牛） | 整数 `1–10485760`（最大 10 MiB） |

## 响应示例

本地策略：
```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "strategy": "local"
  },
  "success": true
}
```

七牛云策略：
```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "strategy": "qiniu",
    "id": "d7cc7734-a59c-488d-9ea9-602537b24c29",
    "key": "project/20261020/d7cc7734-a59c-488d-9ea9-602537b24c29.png",
    "token": "<qiniu-upload-token>",
    "uploadUrl": "https://upload.qiniup.com"
  },
  "success": true
}
```
