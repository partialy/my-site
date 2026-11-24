# 导出系统配置与作品 ZIP 包

一键导出全站配置与作品数据（`.zip`），用于跨环境迁移或纯配置备份。仅导出结构化配置与作品档案，**不包含**访问日志、请求日志、操作日志、管理员账号及实体文件。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `GET` |
| 路径 | `/api/v1/admin/backups/config-package` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 响应类型 | `application/zip`（`Cache-Control: no-store`） |
| 成功状态码 | `200` |

## ZIP 包内文件清单

| 文件名 | 内容说明 |
| :--- | :--- |
| `manifest.json` | 导出格式标识（`mysite-config-bundle` v1）、导出时间、统计计数与排除项说明 |
| `works.json` | 作品档案数据（含草稿与已发布作品、轮盘图标与封面字段、指标/亮点/技术栈/里程碑等） |
| `sys-configs.json` | 系统内部配置（含主页配置 `portfolio_profile_settings`、站点外观配置、日志模式/白名单、上传配置等） |
| `configs.json` | 参数配置表（`config`） |
| `menus.json` | 后台左侧菜单配置树（`menu`） |
| `dictionaries.json` | 数据字典类型与字典子项（包含 `work_category` 作品分类） |
