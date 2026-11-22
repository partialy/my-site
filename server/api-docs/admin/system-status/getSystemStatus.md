# 获取服务器状态

返回服务端运行环境、内存、CPU、SQLite 数据库文件大小及磁盘可用空间采样（5 秒缓存）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/system-status` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "nodeVersion": "v22.0.0",
    "uptimeSeconds": 3600,
    "processMemoryBytes": 90000000,
    "systemMemoryTotalBytes": 16000000000,
    "systemMemoryFreeBytes": 8000000000,
    "cpuLoadPercent": 12.5,
    "databaseBytes": 1048576,
    "diskFreeBytes": 50000000000,
    "sampledAt": "2026-10-20T08:00:00.000Z"
  },
  "success": true
}
```
