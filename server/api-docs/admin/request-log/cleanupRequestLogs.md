# 清理请求日志

按五种互斥模式之一批量清理 `request_log` 表记录；表未创建时返回 `deleted: 0`。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `DELETE` |
| 路径 | `/api/v1/admin/request-logs` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON，按 `mode` 五选一）

| `mode` | 附加参数 | 清理范围 |
| :--- | :--- | :--- |
| `ids` | `ids: string[]`（1–500 个 32 位 UUID） | 删除指定 `uuid` 的记录 |
| `timeRange` | `startTime`、`endTime`（带时区 ISO 时间） | 起止时间段内（含两端） |
| `beforeTime` | `time`（带时区 ISO 时间） | 严格早于指定时间 |
| `afterTime` | `time`（带时区 ISO 时间） | 严格晚于指定时间 |
| `keepLatest` | `count: number`（整数 `1–1000000`） | 按自增 ID 保留最新 N 条，删除其余 |

## 请求示例

```json
{
  "mode": "keepLatest",
  "count": 100
}
```

## 响应示例

```json
{
  "code": 0,
  "msg": "请求日志已清理",
  "data": {
    "deleted": 12
  },
  "success": true
}
```
