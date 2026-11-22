# 新增白名单规则

向系统配置的请求日志白名单中添加一条匹配规则。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/system-config/whitelist` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 否 | 最多 80 字符；不传时默认使用自动生成的规则 ID |
| `type` | `'wildcard' \| 'exact'` | 是 | 规则类型 |
| `path` | `string` | 是 | 1–500 位，须以 `/api/v1/` 开头，不含 `?`、`#`、空白；`wildcard` 须以 `/**` 结尾且无其他 `*`；`exact` 不能含 `*` |
| `remark` | `string` | 否 | 最多 500 字符 |

## 响应示例

```json
{
  "code": 0,
  "msg": "白名单规则已创建",
  "data": {
    "id": "a1b2c3d4",
    "name": "登录接口",
    "type": "exact",
    "path": "/api/v1/users/login",
    "remark": "",
    "createdAt": "2026-10-20T08:00:00.000Z",
    "updatedAt": "2026-10-20T08:00:00.000Z"
  },
  "success": true
}
```
