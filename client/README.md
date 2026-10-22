# 前台访问记录接入

`client/` 暂无具体项目。未来在前台应用首次加载时调用 `trackVisit()`，例如：

```ts
import { trackVisit } from './visitTracker';

void trackVisit();
```

默认向同源 `/api/v1/visits` 上报当前路径、标题和来源，也可传入 `apiBaseUrl`。浏览器用 `localStorage` 保存访客 UUID 与最近一次上报的 UTC 日期；服务端再以 `(visitor_id, visit_day)` 唯一约束去重。清除浏览器存储、换浏览器或设备后会生成新的访客 ID，因此这是尽力去重，不是可靠的用户身份识别。每天只记录首次访问的页面，页面路径用于分析当日入口页。

## 业务用户接口模板

`userAuth.ts` 提供框架无关的注册、登录和 `me` 请求方法。具体项目决定如何保存用户 JWT，并将读取方法传给客户端：

```ts
import { createUserAuthClient } from './userAuth';

const users = createUserAuthClient({ getToken: () => sessionStorage.getItem('user-token') });
const result = await users.login({ account: 'demo_user', password: 'your-password' });
sessionStorage.setItem('user-token', result.token);
const profile = await users.me();
```

用户 JWT 与管理端 JWT 不通用；正式项目可按目标平台选择 Token 存储方式。

## 通用文件上传

`client/uploadFile.ts` 是独立的浏览器上传模板，可直接复制到具体业务前端，不依赖 React 或管理端 Token。管理端保留自己的 `admin/src/api/uploadFile.ts` 副本，不跨目录导入。上传接口位于公开的 `/api/v1/uploads/**`，默认同源；跨域部署时传入公共 API 根路径。返回值的 `url` 是完整访问地址，可直接保存到业务表。

```ts
import { uploadFile } from './uploadFile';

const uploaded = await uploadFile(file, { apiBaseUrl: 'https://api.example.com/api/v1' });
const imageUrl = uploaded.url; // 保存到业务表的 URL 字段
```

`uploadFile` 先用文件信息调用一次 `/api/v1/uploads/prepare`。本地策略直接传 server；七牛策略从同一响应取得 token 后直传七牛，再通知 server 核验登记。公开上传接口按 IP 限流，业务项目可按需要增加登录态或更严格的上传配额。
