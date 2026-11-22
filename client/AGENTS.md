# client 模块约定

> 本文件维护 `client/` 模块规范；全局跨模块契约（响应结构、分页标准、UUID 规范、文档同步要求及 Git 提交规范）见根目录 [AGENTS.md](../AGENTS.md)。

## 模块定位与边界

- `client/` 预留给复制本基础框架后的具体业务前台项目开发（目前尚未选定特定前端框架，仅提供通用接入模板）。
- `client/` 与 `admin/` 保持独立：**禁止跨目录互相导入代码**，需要复用的逻辑各自在目录内维护独立副本。
- 业务前台开发开始并确定具体技术栈（如 Vue / React / uni-app 等）后，应同步更新本文件补充目录结构、状态管理、路由及构建规范。

## 现有可复用模板

当前提供以下框架无关的 TypeScript 模板（用法说明见 [client/README.md](README.md)）：

- **[uploadFile.ts](uploadFile.ts)**：通用浏览器文件上传入口，封装 `/api/v1/uploads/{prepare,local,complete}` 流程（本地直传 / 七牛云凭证直传），返回可直接保存到业务表的完整文件访问 `url`。
- **[visitTracker.ts](visitTracker.ts)**：前台页面访问上报工具（`POST /api/v1/visits`），基于 `localStorage` 与 UTC 日期实现同一访客每日首次访问去重。

## 服务端接口对接约定

- 前台仅调用公开接口（`/api/v1/**`），禁止调用管理端 `/api/v1/admin/**` 接口。
- 所有请求响应解析、分页列表查询与资源定位必须严格遵守根目录 `AGENTS.md` 中的 `{ code, msg, data, success }`、纯 `offset / limit` 分页与 32 位无连字符 `uuid` 规范；可用接口列表与参数细节以 [server/api-docs/index.md](../server/api-docs/index.md) 中的 `client/` 分类文档为准。
