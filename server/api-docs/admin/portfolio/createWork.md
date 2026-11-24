# 新增作品

创建一条新的作品展示档案；若传入 `heroFileId`，服务端自动校验文件库状态并解析访问 URL。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/works` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 成功状态码 | `201` |

## 请求体核心字段

- `slug`、`name`、`enName`、`shortTitle`、`tagline`、`summary`、`category`、`year`、`version`、`license`
- `platforms`（`['PC' | 'Web' | 'Android']`）、`accentHex`、`iconKey`、`iconImage`、`iconFileId`、`heroImage`、`heroFileId`、`heroAlt`
- `githubUrl`、`giteeUrl`、`websiteUrl`、`installCommand`
- `metrics`、`highlights`、`techStack`、`releases`、`detailIntro`、`detailArchitecture`
- `featuredHome`、`status`（`'draft' | 'published'`）、`sortOrder`

## 常见错误码

- `1001`（HTTP 400 / 409）：参数校验失败或 Slug 已被占用。
