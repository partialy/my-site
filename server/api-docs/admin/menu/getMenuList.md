# 获取菜单列表

从服务端内存缓存全量返回扁平菜单结构（非增长式配置，不分页）。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/menus` |
| 鉴权 | 管理员 JWT |
| 成功状态码 | `200` |

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "key": "home",
      "label": "首页",
      "type": "route",
      "parentKey": null,
      "path": "/",
      "action": null,
      "icon": "Home",
      "sort": 10,
      "visible": true
    }
  ],
  "success": true
}
```
