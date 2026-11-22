# 获取系统日志配置

读取请求日志记录模式、白名单规则列表及控制台日志格式配置。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/system-config` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "requestLogMode": "white_list",
    "requestLogWhitelist": [
      {
        "id": "a1b2c3d4",
        "name": "公开接口",
        "type": "wildcard",
        "path": "/api/v1/**",
        "remark": "",
        "createdAt": "2026-10-20T08:00:00.000Z",
        "updatedAt": "2026-10-20T08:00:00.000Z"
      }
    ],
    "consoleLogEnabled": true,
    "consoleLogFormat": "[${time}][${method}] ${url}"
  },
  "success": true
}
```
