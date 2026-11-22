# 下载 SQLite 数据库备份

在线生成当前 SQLite 数据库一致性快照（`.sqlite.bak`）并返回二进制下载流，下载完成后清理临时文件。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/backups/database` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 响应类型 | 二进制文件流（`Cache-Control: no-store`） |
| 成功状态码 | `200` |

## 注意事项

- 备份**仅包含 SQLite 数据库文件**（包含配置、支付密钥/证书等数据库字段），**不包含** `server/data/uploads/` 与 `server/data/site-icons/` 目录下的实体文件。
