# MySite 前台客户端（Next.js）

面向个人主页、作品展示与资源提供的 SEO 友好型前台应用，基于 Next.js App Router + TypeScript + Tailwind CSS v4 + Motion 构建，复刻暗黑沉浸式展厅与全站页面，并通过独立 Service 层预留后端对接。

## 快速开始

```bash
# 1. 复制环境变量配置（按需修改）
cp .env.example .env.local

# 2. 安装依赖
npm install

# 3. 启动开发服务器（默认端口 3001，自动代理 /api/v1 到 http://127.0.0.1:3000）
npm run dev
```

常用脚本：

- `npm run dev`：启动 Next.js 开发服务器（`http://localhost:3001`）
- `npm run build`：生产构建
- `npm run start`：启动生产服务（端口 `3001`）
- `npm run typecheck`：执行 TypeScript 类型检查
- `npm run lint`：执行 ESLint 代码检查

## 页面与数据分层

- `/`：全屏作品展厅（桌面端左弧时钟轮盘 + 4 页 PPT 垂直翻页 + 变形操作栏；移动端混合滚动 + 65% 宽度毛玻璃抽屉导航）。
- `/works`：全部作品目录页（分类筛选 + 多字段搜索）。
- `/works/[slug]`：作品完整档案详情页（性能指标、亮点、技术架构分层、快速安装命令、版本演进、上下作品翻页）。
- `/about`：关于作者页（作者背景、三条创作原则、邮箱与作品目录入口）。

所有页面数据统一通过 `src/services/`（`siteService`、`showcaseService`、`worksService`、`workDetailService`、`aboutService`）获取；当前由 `src/services/mockData.ts` 模拟返回，后续服务端就绪后直接替换为 `requestApi()` 调用即可。
