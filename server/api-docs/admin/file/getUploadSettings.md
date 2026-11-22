# 读取上传设置

读取当前文件存储策略（本地或七牛云）及域名配置；`secretKey` 不返回原文，仅返回 `secretKeyConfigured` 状态。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/upload-settings` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "strategy": "local",
    "localDomain": "",
    "accessKey": "",
    "secretKeyConfigured": false,
    "bucket": "",
    "root": "",
    "uploadUrl": "https://upload.qiniup.com",
    "domain": ""
  },
  "success": true
}
```
