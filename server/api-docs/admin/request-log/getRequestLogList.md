# 分页查询请求日志

按新到旧分页查询 HTTP 请求日志；若 `request_log` 表尚未创建，直接返回空分页列表且不触发建表。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/request-logs` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | 整数 `>= 0`，默认 `0` |
| `limit` | `number` | 否 | 整数 `1–100`，默认 `20` |
| `method` | `string` | 否 | 1–16 位英文字母，服务端自动转大写 |
| `path` | `string` | 否 | 最多 500 字符，子串匹配 |
| `status` | `number` | 否 | 整数 `100–599` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "uuid": "7a9e4c72b0614ee69ed8d986dbd6c919",
        "time": "2026-10-20T08:00:00.000Z",
        "method": "GET",
        "path": "/api/v1/site-settings",
        "url": "/api/v1/site-settings",
        "requestData": null,
        "responseData": "{\"code\":0,\"msg\":\"成功\",\"success\":true}",
        "status": 200,
        "durationMs": 4,
        "ip": "127.0.0.1",
        "origin": "http://localhost:5173",
        "referer": "http://localhost:5173/",
        "userAgent": "Mozilla/5.0"
      }
    ],
    "total": 1,
    "offset": 0,
    "limit": 20,
    "hasMore": false
  },
  "success": true
}
```
