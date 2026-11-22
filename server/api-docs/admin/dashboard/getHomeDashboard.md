# 获取首页统计数据

聚合返回访问统计（今日/昨日/近7日及7日/30日趋势）及近7日请求日志聚合指标。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/home` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "visits": {
      "today": 18,
      "yesterday": 25,
      "last7Days": 142,
      "trend7": [{ "day": "2026-10-20", "visits": 18 }],
      "trend30": [{ "day": "2026-10-20", "visits": 18 }]
    },
    "requestLogs": {
      "total": 320,
      "successRate": 98.5,
      "sources": [{ "name": "localhost:5173", "count": 290 }],
      "topPaths": [{ "path": "/api/v1/site-settings", "count": 120 }]
    }
  },
  "success": true
}
```
