# MySite 作品 JSON 生成规范（AI 项目探索规则）

> 本规范用于指导 AI 代码助手在任意目标代码仓库中自动探索源码、配置文件、文档与 Git 提交历史，并生成一份可直接导入 **MySite Admin → 作品管理** 的标准 `.json` 档案文件。
>
> **使用方式**：将本文件作为规则/上下文提供给任意项目的 AI 助手，令其分析当前项目后按本规范输出完整 JSON；在 MySite 后台点击 **「导入 JSON 新建」** 或在弹窗内点击 **「导入 JSON 填充」**，随后只需手动选择封面图片与轮盘 AppIcon 即可保存发布。

---

## 一、AI 探索与事实约束（必读）

在输出 JSON 前，AI **必须**先阅读目标项目的真实代码与文档，严禁凭空臆测或套用虚构数字：

1. **基础元数据采集**：
   - 读取 `package.json`、`Cargo.toml`、`pyproject.toml`、`go.mod`、`pom.xml`、`pubspec.yaml`、`README.md`、`LICENSE` 等文件，提取真实项目名、当前版本号（`version`）、开源协议（`license`）、支持平台（`platforms`）、依赖技术栈与安装命令（`installCommand`）。
   - 若项目含 `git` 仓库，检查 `git remote -v` 获取仓库地址（`links.github` / `links.gitee`），检查 `git tag`、`CHANGELOG.md` 或近期 `git log` 提取 `releases` 版本里程碑与 `year`。
2. **源码与架构分析**：
   - 扫描核心目录结构（入口文件、核心模块、状态管理、数据持久化、UI/渲染层、构建部署配置），提炼真实、准确的 `highlights`（核心亮点）与 `techStack`（技术栈分层）及 `detailArchitecture`。
3. **禁止捏造数据（尤其是 `metrics`）**：
   - 只有项目中明确测得或源码可验证的数据才能写入 `metrics`（例如包体积、模块数量、支持格式/指令数、预设规则数、测试/构建真实耗时）。
   - **禁止**编造虚假的 QPS、毫秒耗时、准确率或用户量。若仓库无基准测试数字，可用客观工程规格替代（例如 `依赖分层: 核心引擎 / 零外部运行时`、`支持平台: Windows / macOS`、`内置主题: 12 套` 等）。
4. **视觉字段留白原则**：
   - 封面图片（`heroImage`）、轮盘 AppIcon（`iconImage` / `iconKey`）、排序权重（`sortOrder`）、发布开关（`status` / `featuredHome`）默认交由人工在后台界面挑选或设置，**JSON 中无需填写图片或图标字段**（留空或省略即可；导入器会自动保留编辑弹窗中已选的图片、Icon 与排序）。

---

## 二、输出格式要求

- **仅输出标准 UTF-8 JSON 对象**（根节点为 `{ ... }`），禁止包含注释（`//`、`/* */`）、尾部逗号或未转义换行符。
- 若向用户输出保存建议，推荐文件名为 `<slug>.work.json`。
- 中文文案遵循克制、专业、工程师视角，严格控制建议字数，避免在首页 `100dvh` 固定视口布局中发生换行溢出。

---

## 三、完整字段规范与前端映射对照表

### 1. 基础标识与展示文案

| JSON 字段 | 类型 | 必填 | 校验/格式约束 | 前端展示位置 | AI 撰写要求与建议长度 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slug` | `string` | 是 | `2~60` 字符；仅支持 `^[a-z0-9]+(?:-[a-z0-9]+)*$` | 作品详情路由 `/works/<slug>` 与后台检索 | 优先使用仓库名或英文简称的小写 kebab-case |
| `name` | `string` | 是 | `1~60` 字符 | 首页 Slide 1~4 主标题、目录卡片、详情页标题 | 作品中文名（若纯英文项目可用英文或官方中文译名） |
| `enName` | `string` | 是 | `1~80` 字符 | 首页英文副标牌、页面背景装饰铭牌 | 英文正式名称（如 `OrbitNote`、`MySite`） |
| `shortTitle` | `string` | 是 | `1~20` 字符（**建议 4~6 字，不超过 10 字**） | 首页左侧时钟轮盘选项文字、移动端导航抽屉 | 极简短标题，过长会影响轮盘扇区美观 |
| `tagline` | `string` | 是 | `1~80` 字符 | 轮盘悬浮预览卡、详情页副标题 | 一句话精炼说明核心定位（建议 `12~28` 字） |
| `summary` | `string` | 是 | `1~300` 字符（**建议 80~120 字**） | 首页第 1 屏简介、作品目录列表卡片描述 | 交代目标受众、核心能力与关键技术价值 |
| `category` | `string` | 是 | `1~60` 字符，须为后台 `work_category` 字典值 | 首页标签、目录页分类筛选、`JsonLd` 分类 | 从下文预设分类码中择一 |
| `year` | `string` | 是 | `4~12` 字符 | 首页与详情页元信息标签 | 最新主版本年份或活跃年份，如 `"2026"` |
| `version` | `string` | 是 | `1~30` 字符 | 首页版本角标、详情页顶部参数栏 | 读取自包描述文件或 Git Tag，如 `"v2.4.0"` |
| `license` | `string` | 是 | `1~40` 字符 | 详情页元信息栏、SEO 元数据 | 如 `"MIT"`、`"Apache-2.0"`、`"GPL-3.0"`、`"Private"` |
| `platforms` | `string[]` | 是 | `1~3` 项；枚举值仅限 `"PC"`、`"Web"`、`"Android"` | 作品列表标签、详情页支持平台角标 | 根据运行环境如实多选（桌面端统一映射为 `"PC"`） |
| `accentHex` | `string` | 是 | `^#[0-9a-fA-F]{6}$`（6 位十六进制颜色） | 首页展厅主题光晕、按钮高亮、进度条色调 | 推荐高质感低刺眼主题色，如 `#E5A93C`、`#4F8BFF`、`#38B287`、`#C7A969` |

#### 预设 `category` 字典值一览

| 字典编码 (`value`) | 中文含义 | 适用项目类型示例 |
| :--- | :--- | :--- |
| `efficiency` | 效率软件 | 笔记、知识库、日程、桌面效率套件、自动化客户端 |
| `design-tool` | 设计工具 | 排版引擎、可视化编辑器、配色/字体工具、图形客户端 |
| `creative-audio` | 创意音频 | 音频合成、播放器、DAW 插件、音效处理器 |
| `design-system` | 设计系统 | UI 组件库、图标库、Design Token、CSS 框架 |
| `dev-tool` | 开发工具 | CLI、SDK、脚手架、后端框架、API 调试与运维工具 |
| `photography` | 影像应用 | 图片处理、RAW 调色、截图录屏、计算机视觉前端工具 |

---

### 2. 链接、说明与技术架构

| JSON 字段 | 类型 | 必填 | 校验/格式约束 | 前端展示位置 | AI 撰写要求 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `links` | `object` | 推荐 | `{ github, gitee, website }`，每项 `0~500` 字符，须为 `http(s)://...`、`/站内路径` 或 `""` | 首页右下角悬浮操作条、作品详情页操作按钮 | **无对应地址时必须填空字符串 `""`**；`website` 为 `""` 时前台自动禁用并显示「暂未开放」 |
| `heroAlt` | `string` | 推荐 | `0~200` 字符 | 首页封面 `<img>` `alt`、搜索引擎图片索引 | 客观描述该软件主界面或预览图应呈现的内容，利于 SEO |
| `installCommand` | `string` | 可选 | `0~300` 字符 | **仅作品详情页**展示快捷复制安装框 | 如 `npm i xxx`、`cargo install xxx`、`docker compose up -d`；无安装包的项目填 `""` |
| `detailIntro` | `string` | 推荐 | `0~400` 字符（**建议 100~180 字**） | 首页第 2 屏右侧导语、详情页「设计缘起」 | 阐述为什么做这个项目、解决了什么行业痛点与设计取舍 |
| `detailArchitecture` | `string` | 推荐 | `0~500` 字符（**建议 120~200 字**） | 首页第 3 屏架构总览、详情页「工程架构」 | 概括项目总体分层、核心数据流与技术选型理由 |

> 兼容说明：导入器优先读取 `links: { github, gitee, website }`，同时也兼容旧式平铺字段 `githubUrl`、`giteeUrl`、`websiteUrl`。

---

### 3. 结构化列表字段（数组）

#### `metrics` — 量化指标 / 工程规格（最多 6 项，**首页 Slide 1 & 2 展示前 3 项**）

```json
{
  "value": "14 ms",
  "label": "冷启动检索耗时",
  "context": "10 万字本地库 / Apple M2"
}
```

- `value`：`1~30` 字符（短数值或核心规格词，展示在大字号 KPI 位置，建议不超过 10 字符）
- `label`：`1~40` 字符（指标名称，建议 4~10 字）
- `context`：`0~80` 字符（测试环境、基线或补充说明，建议 8~20 字）

#### `highlights` — 核心亮点（最多 6 项，**首页 Slide 2 展示前 3 项，推荐正好写 3 条**）

```json
{
  "index": "01",
  "title": "本地优先零锁定存储",
  "description": "全部文档以标准 Markdown 文件夹落地保存，无需专有数据库即可长期迁移与版本管理。"
}
```

- `index`：`1~10` 字符（序号 `"01"`、`"02"`、`"03"`）
- `title`：`1~40` 字符（**建议 8~14 字**）
- `description`：`1~200` 字符（**建议 40~75 字**）

#### `techStack` — 技术栈分层（最多 8 项，**首页 Slide 3 展示前 4 行，推荐 3~4 行**）

```json
{
  "layer": "表现与交互层",
  "stack": "Next.js 16 · React 19 · Tailwind CSS",
  "note": "App Router 原生服务端渲染与 SEO 元数据注入"
}
```

- `layer`：`1~40` 字符（架构层级名，如 `内核引擎`、`前端框架`、`数据持久层`、`部署交付`）
- `stack`：`1~80` 字符（实际使用到的关键框架/语言，使用 `·` 分隔）
- `note`：`0~120` 字符（一句话职责说明，建议 10~28 字）

#### `releases` — 版本演进里程碑（最多 20 项，**首页 Slide 4 展示前 3 条，详情页展示全部**）

```json
{
  "version": "v2.4.0",
  "date": "2026.10",
  "summary": "新增自定义轮盘 AppIcon 渲染与全量配置 ZIP 包无损迁移。"
}
```

- `version`：`1~30` 字符（最新版本号排在数组第 0 位，按时间倒序排列）
- `date`：`1~20` 字符（推荐格式 `YYYY.MM` 或 `YYYY.MM.DD`）
- `summary`：`1~200` 字符（本版本关键交付内容，建议 20~60 字）

---

### 4. 可选图片字段（默认省略，由人工在后台挑选）

> 导入器在执行 **「导入 JSON 新建」** 或在编辑弹窗内 **「导入 JSON 填充」** 时：
> - 默认**保留**弹窗当前已经选择的 `heroImage` / `heroFileId`、`iconImage` / `iconFileId`、`iconKey`、`featuredHome`、`status`、`sortOrder`；
> - 仅当 JSON 中显式传入**非空** `heroImage` 或 `iconImage`（合法 `https://...` 或 `/...` 路径）时，才填充对应图片 URL（同时解绑 `fileId`）。
>
> 因此 AI 生成面向新项目的 JSON 时，**直接省略图片相关字段即可**。

---

## 四、标准 JSON 输出示例

```json
{
  "slug": "mysite-showcase",
  "name": "MySite 作品展厅",
  "enName": "MySite Showcase",
  "shortTitle": "作品展厅",
  "tagline": "融合时钟轮盘交互与原生 SEO 的全栈个人主页系统",
  "summary": "面向独立开发者与数字工匠的作品展示门户。采用 Next.js App Router 与 Express + SQLite 轻量服务端，结合 100dvh 四屏结构化叙事与后台可视化档案管理，实现开箱即用的个人品牌阵地。",
  "category": "dev-tool",
  "year": "2026",
  "version": "v1.2.0",
  "license": "MIT",
  "platforms": ["Web", "PC"],
  "accentHex": "#4F8BFF",
  "heroAlt": "MySite 作品展厅深空星轨首页轮盘与四屏叙事界面预览",
  "links": {
    "github": "https://github.com/example/mysite",
    "gitee": "",
    "website": "https://partialy.cn"
  },
  "installCommand": "docker compose up -d",
  "detailIntro": "传统博客或静态简历难以同时承载深度工程架构讲解与灵动交互。项目以全屏时钟轮盘作为视觉锚点，在首屏克制聚焦核心价值，再沿纵轴展开亮点、技术分层与版本演进。",
  "detailArchitecture": "前后端采用清晰三层与契约解耦设计：Client 基于 Next.js Standalone 输出实现服务端直出与结构化 SEO；Admin 基于 React 18 与 Ant Design v5 维护作品与字典；Server 基于 Express 5 与 SQLite 提供幂等迁移、七牛云直传及纯 JSON 配置包迁移能力。",
  "metrics": [
    {
      "value": "4 屏",
      "label": "首页叙事结构",
      "context": "封面 / 亮点 / 架构 / 版本"
    },
    {
      "value": "3 端",
      "label": "统一仓库交付",
      "context": "Client + Admin + Server"
    },
    {
      "value": "Docker",
      "label": "一键容器编排",
      "context": "内置 Nginx 反代与 Standalone 运行"
    }
  ],
  "highlights": [
    {
      "index": "01",
      "title": "极坐标时钟轮盘交互",
      "description": "支持桌面端圆弧轮盘与移动端抽屉联动，支持自定义 AppIcon 图片与预设矢量图标无缝兜底。"
    },
    {
      "index": "02",
      "title": "原生 SEO 与动态站图",
      "description": "内置动态 OpenGraph 图、JSON-LD 结构化数据、robots.txt 与 sitemap.xml，确保作品页即发即收录。"
    },
    {
      "index": "03",
      "title": "零日志配置包无损迁移",
      "description": "后台支持一键导出/导入含作品、主页设置、菜单与字典的纯配置 ZIP 包，自动隔离访问与审计日志。"
    }
  ],
  "techStack": [
    {
      "layer": "前台展厅",
      "stack": "Next.js 16 · React 19 · Tailwind CSS",
      "note": "App Router 服务端渲染与离线字体打包"
    },
    {
      "layer": "管理后台",
      "stack": "React 18 · TypeScript · Ant Design v5",
      "note": "字典驱动表单、七牛文件库与 Modal 档案编辑"
    },
    {
      "layer": "服务端与存储",
      "stack": "Express 5 · Zod · better-sqlite3",
      "note": "严格契约校验、SQLite 幂等迁移与零依赖 ZIP 打包"
    },
    {
      "layer": "部署与网关",
      "stack": "Docker Compose · Nginx",
      "note": "多阶段构建镜像与同域 /api 反向代理模板"
    }
  ],
  "releases": [
    {
      "version": "v1.2.0",
      "date": "2026.11",
      "summary": "新增作品 JSON 智能导入规范与解析、后台配置包 ZIP 一键导出/导入及自定义 AppIcon 支持。"
    },
    {
      "version": "v1.0.0",
      "date": "2026.10",
      "summary": "完成首页四屏轮盘展厅、作品目录、详情页、Admin 管理台及 Docker 生产部署落地。"
    }
  ]
}
```

