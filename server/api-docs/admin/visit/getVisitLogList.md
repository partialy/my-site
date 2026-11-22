# 分页查询访问日志

分页查询前台按 UTC 日期去重上报的访客入口页面访问日志。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/visits` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | 整数 `>= 0`，默认 `0` |
| `limit` | `number` | 否 | 整数 `1–100`，默认 `20` |
| `path` | `string` | 否 | 最多 500 字符，子串筛选 |
| `visitorId` | `string` | 否 | 最多 36 字符，子串筛选 |
| `startDay` | `string` | 否 | UTC 日期 `YYYY-MM-DD` |
| `endDay` | `string` | 否 | UTC 日期 `YYYY-MM-DD`，须 `>= startDay` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": 1,
        "day": "2026-10-20",
        "visitorId": "7a9e4c72-b061-4ee6-9ed8-d986dbd6c919",
        "path": "/",
        "pageTitle": "首页",
        "referrer": "",
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0",
        "createdAt": "2026-10-20T08:00:00.000Z"
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
