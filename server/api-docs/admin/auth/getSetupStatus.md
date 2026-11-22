# 查询初始化状态

查询当前系统是否已完成初始管理员初始化。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/setup/status` |
| 鉴权 | 无需鉴权 |
| 成功状态码 | `200` |

## 请求参数

无。

## 响应示例

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "initialized": true
  },
  "success": true
}
```
