# 分页查询操作审计日志

分页查询管理端成功写操作及业务显式写入的操作审计记录。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/operation-logs` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## Query 参数

| 参数 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `offset` | `number` | 否 | 整数 `>= 0`，默认 `0` |
| `limit` | `number` | 否 | 整数 `1–100`，默认 `20` |
| `module` | `string` | 否 | 1–100 字符，模块筛选 |
| `actor` | `string` | 否 | 1–100 字符，操作人名称筛选 |
| `startTime` | `string` | 否 | 带时区 ISO 时间 |
| `endTime` | `string` | 否 | 带时区 ISO 时间，须 `>= startTime` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "list": [
      {
        "id": 1,
        "actorType": "admin",
        "actorId": "1",
        "actorName": "admin",
        "module": "配置管理",
        "action": "update",
        "targetType": "config",
        "targetId": "contact.email",
        "summary": "修改动态配置",
        "changedFields": [],
        "ip": "127.0.0.1",
        "durationMs": 12,
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
