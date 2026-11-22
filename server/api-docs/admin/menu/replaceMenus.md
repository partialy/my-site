# 整体保存菜单

在单个事务中全量替换 `menu` 表并刷新服务端内存缓存（仅控制导航，不做权限控制）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/menus` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

`{ "items": MenuItem[] }`，最多 200 项：

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `key` | `string` | 是 | 1–100 位，以字母开头，仅字母、数字、`_`、`-`，全表唯一 |
| `label` | `string` | 是 | 1–100 位 |
| `type` | `'group' \| 'route' \| 'action'` | 是 | `group` 必须一级且无 `path`/`action`；`route` 须有站内绝对路径且不重复；`action` 仅兼容 `change-password` |
| `parentKey` | `string \| null` | 是 | 非空时必须指向一个一级 `group` 菜单 |
| `path` | `string \| null` | 是 | 路由路径（`/` 开头） |
| `action` | `string \| null` | 是 | 兼容字段 |
| `icon` | `string \| null` | 是 | 最多 100 位 |
| `sort` | `number` | 是 | `>= 0` 整数 |
| `visible` | `boolean` | 是 | 是否在侧栏展示 |

## 响应示例

返回保存后的 `MenuItem[]`（`msg: "菜单已保存"`）。
