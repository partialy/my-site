# 导入系统配置与作品 ZIP 包

上传通过导出接口生成的 `.zip` 配置包，校验后在单个 SQLite 事务内恢复作品数据、主页配置、系统配置、参数配置、菜单配置与数据字典，并同步刷新内存缓存；不会改动访问日志、请求日志、操作日志及管理员账号。

## 基本信息

| 属性 | 说明 |
| :--- | :--- |
| 方法 | `POST` |
| 路径 | `/api/v1/admin/backups/config-package/import` |
| 鉴权 | 管理员 JWT |
| 操作审计 | 记录 |
| 请求类型 | 二进制流（`application/zip`、`application/x-zip-compressed` 或 `application/octet-stream`，上限 `10MB`） |
| 成功状态码 | `200` |

## 响应结构（`data`）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `worksCount` | `number` | 导入的作品数量 |
| `sysConfigsCount` | `number` | 导入的系统内部配置条数 |
| `configsCount` | `number` | 导入的参数配置条数 |
| `menusCount` | `number` | 导入的菜单项数量 |
| `dictionariesCount` | `number` | 导入的字典类型数量 |
| `unlinkedFileRefs` | `number` | 在目标库中未找到对应 `file` 记录而被自动解绑的文件引用数（原图片 URL 仍保留） |

## 注意事项

- 若为跨环境导入（目标环境缺少源环境本地上传的 `file` 记录），服务端会自动解绑找不到的 `*_file_id` 引用而保留对应 URL 路径/外链，确保导入不中断。
- 导入会覆盖当前环境的作品、菜单、字典及系统/参数配置，建议先导出当前配置包备份后再执行。
