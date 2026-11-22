# 保存登录外观

单独保存管理端登录页的背景模式、颜色、图片文件引用及登录卡片透明度。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `PUT` |
| 路径 | `/api/v1/admin/site-settings/login-appearance` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `200` |

## 请求体（JSON）

| 字段 | 类型 | 必填 | 校验规则 |
| :--- | :--- | :--- | :--- |
| `backgroundMode` | `'solid' \| 'gradient' \| 'image'` | 是 | 背景模式；切换至纯色或渐变时自动清除背景图引用 |
| `solidColor` | `string` | 是 | `#RRGGBB` 十六进制颜色 |
| `gradientStartColor` | `string` | 是 | `#RRGGBB` |
| `gradientEndColor` | `string` | 是 | `#RRGGBB` |
| `gradientDirection` | `number` | 是 | 整数，`0`–`359`（度） |
| `backgroundFileId` | `string \| null` | 是 | 标准 UUID；`image` 模式必填且须指向未归档的 PNG/JPEG/WebP/GIF 文件 |
| `cardOpacity` | `number` | 是 | 整数，`30`–`100` |

## 响应示例

返回最新 `SiteSettingsData`（`msg: "登录外观已保存"`）。
