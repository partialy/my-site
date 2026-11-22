# 保存系统日志配置

更新请求日志 SQLite 记录模式及控制台日志输出配置；若切换为非 `off` 模式，会按需初始化 `request_log` 表。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/system-config` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `requestLogMode` | `'all' \| 'white_list' \| 'off'` | 是 | 日志记录模式 |
| `consoleLogEnabled` | `boolean` | 是 | 是否开启控制台日志 |
| `consoleLogFormat` | `string` | 是 | 1–500 位，支持 `${time}`、`${method}`、`${url}`、`${status}`、`${duration}`、`${ip}` |

## 响应示例

返回更新后的完整系统日志配置（同 [getSystemConfig.md](getSystemConfig.md)）。
