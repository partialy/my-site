CREATE TABLE IF NOT EXISTS work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  en_name TEXT NOT NULL,
  short_title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  year TEXT NOT NULL,
  version TEXT NOT NULL,
  license TEXT NOT NULL,
  platforms_json TEXT NOT NULL DEFAULT '["Web"]',
  accent_hex TEXT NOT NULL DEFAULT '#E5A93C',
  icon_key TEXT NOT NULL DEFAULT 'orbit',
  icon_image TEXT NOT NULL DEFAULT '',
  icon_file_id TEXT,
  hero_image TEXT NOT NULL DEFAULT '',
  hero_file_id TEXT,
  hero_alt TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  gitee_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  install_command TEXT NOT NULL DEFAULT '',
  metrics_json TEXT NOT NULL DEFAULT '[]',
  highlights_json TEXT NOT NULL DEFAULT '[]',
  tech_stack_json TEXT NOT NULL DEFAULT '[]',
  releases_json TEXT NOT NULL DEFAULT '[]',
  detail_intro TEXT NOT NULL DEFAULT '',
  detail_architecture TEXT NOT NULL DEFAULT '',
  featured_home INTEGER NOT NULL DEFAULT 1 CHECK (featured_home IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_work_uuid ON work(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_slug ON work(slug);
CREATE INDEX IF NOT EXISTS idx_work_status_sort ON work(status, featured_home, sort_order ASC, id ASC);

CREATE TRIGGER IF NOT EXISTS work_uuid_required_insert
BEFORE INSERT ON work
WHEN NEW.uuid IS NULL OR length(trim(NEW.uuid)) = 0
BEGIN
  SELECT RAISE(ABORT, 'work.uuid required');
END;

CREATE TRIGGER IF NOT EXISTS work_uuid_required_update
BEFORE UPDATE OF uuid ON work
WHEN NEW.uuid IS NULL OR length(trim(NEW.uuid)) = 0
BEGIN
  SELECT RAISE(ABORT, 'work.uuid required');
END;

INSERT OR IGNORE INTO dict_type (uuid, code, name, remark, is_public, enabled, created_at, updated_at)
VALUES (
  '7a8b9c0d1e2f4a3b8c9d0e1f2a3b4c5d',
  'work_category',
  '作品分类',
  '个人主页作品展厅与作品目录分类字典',
  1,
  1,
  '2026-10-01T00:00:00.000Z',
  '2026-10-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c01', id, '效率软件', 'efficiency', 10, 1, 'gold', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c02', id, '设计工具', 'design-tool', 20, 1, 'orange', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c03', id, '创意音频', 'creative-audio', 30, 1, 'blue', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c04', id, '设计系统', 'design-system', 40, 1, 'purple', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c05', id, '开发工具', 'dev-tool', 50, 1, 'green', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
SELECT '8a1b2c3d4e5f4a6b8c9d0e1f2a3b4c06', id, '影像应用', 'photography', 60, 1, 'cyan', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'
FROM dict_type WHERE code = 'work_category';

INSERT OR IGNORE INTO work (
  uuid, slug, name, en_name, short_title, tagline, summary,
  category, year, version, license, platforms_json, accent_hex, icon_key,
  hero_image, hero_file_id, hero_alt, github_url, gitee_url, website_url, install_command,
  metrics_json, highlights_json, tech_stack_json, releases_json,
  detail_intro, detail_architecture, featured_home, status, sort_order, created_at, updated_at
) VALUES
(
  '1a2b3c4d5e6f4a7b8c9d0e1f2a3b4c5d',
  'orbitnote',
  '星轨笔记',
  'OrbitNote',
  '星轨笔记',
  '本地优先的空间知识图谱与长文写作台',
  '专为研究者与工程师打造的双向链接笔记系统。基于 Rust 核心引擎实现毫秒级全文检索，让零散灵感在可视化的星轨网络中自然聚合成结构化知识体系。',
  'efficiency',
  '2026',
  'v2.4.0',
  'MIT',
  '["PC","Web","Android"]',
  '#E5A93C',
  'orbit',
  '/images/works/orbitnote.jpg',
  NULL,
  '星轨笔记桌面端双栏知识图谱与 Markdown 编辑界面展示',
  'https://github.com/linyu-works/orbitnote',
  'https://gitee.com/linyu-works/orbitnote',
  'https://orbitnote.linyu.works',
  'brew install --cask linyu/tap/orbitnote',
  '[{"label":"十万笔记冷启动检索","value":"14 ms","context":"Rust 倒排索引 · Apple M2 实测"},{"label":"单库加密同步体积节省","value":"62%","context":"CRDT 增量快照压缩对比 JSON"},{"label":"活跃开源社区贡献者","value":"184 人","context":"过去 12 个月合并 PR 统计"}]',
  '[{"index":"01","title":"纯本地 Markdown 与端到端同步","description":"所有文稿以明文标准 Markdown 存放在本地文件夹中，无任何私有锁定格式；通过自研 CRDT 增量协议实现多端无冲突加密同步。"},{"index":"02","title":"无卡顿万级节点星轨视图","description":"采用 WebGPU 与力导向空间分区算法渲染知识图谱，即使笔记超过一万篇依然保持 60fps 丝滑缩放与邻域高亮。"},{"index":"03","title":"专注写作与双链即刻引用","description":"输入双中括号即可模糊匹配任意段落块并嵌入实时预览，无需切换窗口即可完成跨文档资料汇编与脚注校验。"}]',
  '[{"layer":"桌面容器与索引核心","stack":"Rust · Tauri 2 · Tantivy","note":"内存占用低于 68MB，冷启动小于 300ms"},{"layer":"编辑器与图谱引擎","stack":"React 19 · CodeMirror 6 · WebGPU","note":"零丢帧语法高亮与大规模关系图绘制"},{"layer":"多端同步与离线协议","stack":"Yjs CRDT · WebCrypto AES-GCM","note":"端到端零知识加密，支持自建 S3 / WebDAV"}]',
  '[{"version":"v2.4.0","date":"2026.09","summary":"全新星轨聚类视图上线，支持按时间轴回放知识演化路径。"},{"version":"v2.1.0","date":"2026.04","summary":"引入 WebDAV 与 S3 兼容增量同步引擎，移动端读写速度提升 3 倍。"},{"version":"v1.0.0","date":"2025.08","summary":"首个开源稳定版发布，完整支持双链语法、白板卡片与插件沙盒。"}]',
  '星轨笔记诞生于对现有笔记工具“云端绑定重、万字长文掉帧”痛点的长期反思。我们将文件系统作为唯一事实来源，结合 Rust 高性能全文检索与优雅的图形交互，让知识真正归属创作者本人。',
  '整体采用前后端分离的 IPC 进程架构：Rust 后台守护进程负责文件监听、AST 双向链接解析与 Tantivy 全文索引；前端视图层保持极简状态树，通过虚拟滚动与增量差分渲染保证低功耗设备下的流畅输入体验。',
  1,
  'published',
  10,
  '2025-08-01T00:00:00.000Z',
  '2026-09-15T00:00:00.000Z'
),
(
  '2b3c4d5e6f7a4b8c9d0e1f2a3b4c5d6e',
  'moyun',
  '墨韵排版',
  'MoYun Studio',
  '墨韵排版',
  '面向中文出版美学的 Markdown 视觉排版引擎',
  '将瑞士网格秩序与传统中文书刊留白融为一体。只需撰写纯文本 Markdown，即可实时输出符合印刷规范的标点挤压、中西文混排间距与高质量 PDF / EPUB 成书。',
  'design-tool',
  '2026',
  'v1.9.2',
  'Apache-2.0',
  '["PC","Web"]',
  '#D9B98B',
  'feather',
  '/images/works/moyun.jpg',
  NULL,
  '墨韵排版半透明材质层次与出版级网格设计视觉作品',
  'https://github.com/linyu-works/moyun-studio',
  'https://gitee.com/linyu-works/moyun-studio',
  'https://moyun.linyu.works',
  'npx @linyu/moyun-cli build manuscript.md --preset=book',
  '[{"label":"300 页长书排版耗时","value":"1.8 s","context":"WASM 排版核浏览器端本地编译"},{"label":"内置中文标点规则集","value":"48 项","context":"避头尾、行尾挤压、全角配对校验"},{"label":"已导出公开电子出版物","value":"12,400+","context":"来自独立作者与技术专栏团队"}]',
  '[{"index":"01","title":"严谨的中文标点光学挤压","description":"内置符合 GB/T 15834 规范的标点避头尾与连续标点半角压缩算法，彻底消除网页长文常见的行首孤立逗号与参差右边界。"},{"index":"02","title":"所见即所得的版心与网格调试","description":"一键开启黄金比例版心辅助线、基线网格与出血裁切标记，支持实时切换竖排古籍、学术双栏与现代杂志三种版式。"},{"index":"03","title":"一键输出矢量印刷 PDF 与网页长图","description":"基于 Typst 与自研 WASM 字体子集化模块，在浏览器内即可生成自带目录书签与 CMYK 色彩配置文件的印刷级成稿。"}]',
  '[{"layer":"排版内核","stack":"Rust · WebAssembly · HarfBuzz","note":"毫秒级字形整形与断行最优化求解"},{"layer":"前端预览与交互","stack":"Next.js 15 · Canvas 2D · CSS Paged","note":"精确至 0.1pt 的纸张缩放与实时标尺"},{"layer":"字体与导出管线","stack":"WOFF2 Subsetter · PDF/X-4","note":"按需裁切中文字体子集，体积缩减 94%"}]',
  '[{"version":"v1.9.2","date":"2026.10","summary":"新增竖排右翻页电子书模板与旁注（Ruby）自动对齐引擎。"},{"version":"v1.6.0","date":"2026.05","summary":"开放 CLI 批量构建管线，支持 GitHub Actions 自动发布成书。"},{"version":"v1.0.0","date":"2025.11","summary":"首个网页端 WASM 排版工作室上线，支持 12 套精选出版主题。"}]',
  '在屏幕阅读时代，中文长文往往因为缺乏精细的断行与标点处理而显得松散杂乱。墨韵排版致力于将专业书籍设计师的隐性经验代码化，让每位写作者都能轻松拥有博物馆画册般的版面品质。',
  '墨韵排版将基于 Knuth-Plass 动态规划改良的中文断行引擎编译为仅 420KB 的 WebAssembly 模块，配合增量字形缓存，确保每一次敲击键盘都能在 16ms 内完成整页重新排布。',
  1,
  'published',
  20,
  '2025-11-01T00:00:00.000Z',
  '2026-10-12T00:00:00.000Z'
),
(
  '3c4d5e6f7a8b4c9d0e1f2a3b4c5d6e7f',
  'tidewave',
  '汐潮音频',
  'TideWave DSP',
  '汐潮音频',
  '浏览器端低延迟频谱合成与环境声场工作室',
  '无需安装庞大宿主软件，在浏览器中即可完成多轨波表合成、卷积混响与实时 3D 声场编排。专为独立游戏音效师与专注环境声创作者打造。',
  'creative-audio',
  '2026',
  'v1.5.0',
  'MIT',
  '["PC","Web"]',
  '#4F8BFF',
  'audio',
  '/images/works/tidewave.jpg',
  NULL,
  '汐潮音频精密铝制音频处理器与声波雕塑视觉呈现',
  'https://github.com/linyu-works/tidewave-dsp',
  'https://gitee.com/linyu-works/tidewave-dsp',
  'https://tidewave.linyu.works',
  'npm install @linyu/tidewave-audio-worklet',
  '[{"label":"音频处理环路延迟","value":"2.9 ms","context":"AudioWorklet 128 采样帧 · 48kHz"},{"label":"内置模块化 DSP 节点","value":"36 个","context":"滤波器、颗粒合成、物理建模混响"},{"label":"单页并发无爆音轨道","value":"24 轨","context":"WASM SIMD 矢量音频混合测试"}]',
  '[{"index":"01","title":"独立线程 AudioWorklet + WASM SIMD","description":"全部信号处理运行在独立实时音频线程中，彻底隔离界面重绘抖动，支持外接 MIDI 键盘即插即弹。"},{"index":"02","title":"可视化模块化连线与频谱显微镜","description":"拖拽连接振荡器、包络与谐波滤波器，实时观察 20Hz–20kHz 高精度瀑布频谱与相位相关性仪。"},{"index":"03","title":"一键导出无损 WAV 与游戏无缝循环包","description":"内置零交叉点自动裁切算法，快速生成可直接用于 Unity / Godot 的无缝循环环境音效与交互 stems。"}]',
  '[{"layer":"数字信号处理核心","stack":"C++20 / Rust · Emscripten SIMD","note":"浮点零分配音频回调，避免 GC 停顿"},{"layer":"硬件与协议接入","stack":"WebAudio API · WebMIDI API","note":"原生映射旋钮控制器与力度触后"},{"layer":"波形与频谱渲染","stack":"WebGL 2 · Custom Fragment Shader","note":"120Hz 示波器与立体声场李萨如图形"}]',
  '[{"version":"v1.5.0","date":"2026.08","summary":"上线颗粒合成引擎与 18 组实录自然脉冲响应（IR）混响空间。"},{"version":"v1.2.0","date":"2026.02","summary":"完整支持 WebMIDI 硬件映射及自定义预设分享链接。"},{"version":"v1.0.0","date":"2025.09","summary":"开源核心 AudioWorklet DSP 节点库与在线合成器原型。"}]',
  '汐潮音频将传统桌面级数字信号处理技术带入现代 Web 平台。通过严苛的内存管理与多线程音频管线，它证明了浏览器同样能承载专业、温润、无卡顿的声音设计体验。',
  '系统由控制平面（React UI 与状态快照）和音频平面（SharedArrayBuffer 环形缓冲区 + AudioWorklet WASM）严格解耦，所有参数旋钮通过无锁原子变量平滑插值，杜绝调节时的拉链噪声。',
  1,
  'published',
  30,
  '2025-09-01T00:00:00.000Z',
  '2026-08-20T00:00:00.000Z'
),
(
  '4d5e6f7a8b9c4d0e1f2a3b4c5d6e7f8a',
  'yantai',
  '砚台组件',
  'Yantai UI',
  '砚台组件',
  '克制秩序与无障碍优先的 React 19 设计系统',
  '一套拒绝冗余装饰、强调空间比例与精密动效曲线的开源组件库。原生适配 Tailwind v4 与服务端组件，内建完整键盘导航与 WCAG AAA 对比度规范。',
  'design-system',
  '2026',
  'v3.2.1',
  'MIT',
  '["Web","PC"]',
  '#C7A969',
  'layers',
  '/images/works/yantai.jpg',
  NULL,
  '砚台组件设计系统板岩模块、磨砂玻璃与黄铜比例尺静物摄影',
  'https://github.com/linyu-works/yantai-ui',
  'https://gitee.com/linyu-works/yantai-ui',
  'https://yantai.linyu.works',
  'pnpm add @yantai-ui/react @yantai-ui/tokens',
  '[{"label":"核心基础组件数量","value":"52 个","context":"零外部样式冲突 · 全量 Tree-Shaking"},{"label":"单组件平均 Gzip 体积","value":"2.4 KB","context":"基于 Bundlephobia 实测均值"},{"label":"自动化无障碍回归覆盖","value":"100%","context":"Playwright Axe + 键盘焦点陷阱校验"}]',
  '[{"index":"01","title":"源自器物比例的间距与圆角数学","description":"所有嵌套容器遵循严格内外圆角差值公式与 4px 光学基准网格，告别生硬拼接感，默认即呈现沉稳专业气质。"},{"index":"02","title":"自然物理阻尼与统一贝塞尔语言","description":"内置精心调校的微交互缓动预设，确保弹窗展开、抽屉滑入与焦点切换具备一致且克制的呼吸感。"},{"index":"03","title":"面向 Next.js App Router 原生优化","description":"静态展示组件默认零客户端 JS 注入，交互原语支持按需水合，兼顾首屏 SEO 性能与复杂表单状态管理。"}]',
  '[{"layer":"组件原语与状态机","stack":"React 19 · TypeScript 5.9","note":"受控/非受控双模式无缝切换"},{"layer":"样式令牌与主题","stack":"Tailwind CSS v4 · OKLCH Tokens","note":"感知均匀色彩空间，明暗双主题零色偏"},{"layer":"质量保障体系","stack":"Vitest · Playwright Visual Diff","note":"每次提交自动执行 400+ 视觉像素回归"}]',
  '[{"version":"v3.2.1","date":"2026.10","summary":"新增轮盘导航原语与表格虚拟滚动增强，修复 Safari 焦点环渲染细节。"},{"version":"v3.0.0","date":"2026.06","summary":"全面迁移至 Tailwind v4 CSS-first 架构与 OKLCH 语义令牌体系。"},{"version":"v2.0.0","date":"2025.12","summary":"发布完整 Figma 设计变量同步插件与无障碍交互规范手册。"}]',
  '砚台组件追求“工具退居幕后，内容成为主角”的设计哲学。它提供经过真实高密度业务打磨的底层原语，让团队无需反复造轮子即可建立高度统一的视觉与交互水准。',
  '底层采用无头（Headless）逻辑层与视觉皮肤层双包拆分：开发者既可直接引入开箱即用的墨石/宣纸主题，也能只引用状态钩子与 ARIA 属性生成器，定制完全私有的品牌界面。',
  1,
  'published',
  40,
  '2025-12-01T00:00:00.000Z',
  '2026-10-25T00:00:00.000Z'
),
(
  '5e6f7a8b9c0d4e1f2a3b4c5d6e7f8a9b',
  'cloudark',
  '云舟部署',
  'CloudArk CLI',
  '云舟部署',
  '零配置容器编排与边缘节点灰度发布工具',
  '一条声明式配置即可将 Next.js、Go 与 Rust 服务安全推送至自有云主机集群。内置自动 HTTPS 证书续期、零停机蓝绿切换与秒级异常回滚。',
  'dev-tool',
  '2026',
  'v2.1.4',
  'Apache-2.0',
  '["PC","Web"]',
  '#38B287',
  'box',
  '/images/works/cloudark.jpg',
  NULL,
  '云舟部署暗色模块化服务器阵列与银白光导架构等轴测可视化',
  'https://github.com/linyu-works/cloudark',
  'https://gitee.com/linyu-works/cloudark',
  'https://cloudark.linyu.works',
  'curl -fsSL https://cloudark.linyu.works/install.sh | sh',
  '[{"label":"零停机切换中断窗口","value":"0 ms","context":"健康检查通过后原子级反向代理热重载"},{"label":"单二进制文件体积","value":"11.6 MB","context":"纯 Go 静态编译 · 零运行时依赖"},{"label":"平均首次上线配置耗时","value":"< 3 分钟","context":"从空白 Linux 主机到 HTTPS 生效"}]',
  '[{"index":"01","title":"极简 TOML 声明，告别千行 YAML","description":"无需维护复杂的 Kubernetes 控制面，二十行可读配置即可完成多服务编排、密钥加密注入与定时任务托管。"},{"index":"02","title":"自带流量镜像与渐进式灰度放量","description":"支持按权重或请求头将 5% 真实流量切入新版本，实时监控 5xx 错误率并在触及阈值时自动瞬间回滚。"},{"index":"03","title":"SSH 隧道直连，不侵入内网防火墙","description":"基于标准 SSH 多路复用协议完成镜像差分传输与日志流汇聚，无需在目标服务器额外开放管理端口。"}]',
  '[{"layer":"命令行与编排控制面","stack":"Go 1.24 · Cobra · SSH Multiplex","note":"跨平台单文件分发，支持 Linux / macOS"},{"layer":"边缘路由与证书管理","stack":"Caddy Core · ACME TLS-ALPN","note":"自动签发并续期泛域名 HTTPS 证书"},{"layer":"容器构建与缓存","stack":"BuildKit · OCI Layer Delta","note":"只传输变更层，弱网推送提速 4.5 倍"}]',
  '[{"version":"v2.1.4","date":"2026.10","summary":"新增 ARM64 跨架构远程构建节点调度与实时资源火焰图命令。"},{"version":"v2.0.0","date":"2026.05","summary":"重构灰度路由状态机，引入自动健康探测回滚与 Webhook 通知。"},{"version":"v1.0.0","date":"2025.07","summary":"开源首个单机与多节点零停机容器发布工作流工具。"}]',
  '中小团队与独立开发者往往陷入“PaaS 费用昂贵、自建 K8s 运维过重”的两难。云舟部署用一把趁手的工程瑞士军刀，让你以极低的云主机成本享受现代化自动发布与可观测能力。',
  '采用无常驻中心节点的去中心化拓扑：本地 CLI 或 CI 通过加密 SSH 会话协调目标主机上的轻量级容器运行时与边缘代理，状态快照以不可变清单归档，任何时刻都能精确复现历史环境。',
  1,
  'published',
  50,
  '2025-07-01T00:00:00.000Z',
  '2026-10-28T00:00:00.000Z'
),
(
  '6f7a8b9c0d1e4f2a3b4c5d6e7f8a9b0c',
  'lumenvault',
  '光影相册',
  'LumenVault',
  '光影相册',
  '支持广色域 RAW 管理与地理轨迹的私有影像馆',
  '为摄影师与视觉创作者打造的私有化画廊与底片档案库。完整解析主流相机 RAW 与 EXIF 参数，以展览级暗房界面呈现每一帧光影作品。',
  'photography',
  '2026',
  'v1.7.0',
  'GPL-3.0',
  '["PC","Web","Android"]',
  '#E0A44B',
  'aperture',
  '/images/works/lumenvault.jpg',
  NULL,
  '光影相册精密旁轴镜头与光学棱镜折射暖金色光束摄影作品',
  'https://github.com/linyu-works/lumenvault',
  'https://gitee.com/linyu-works/lumenvault',
  'https://lumenvault.linyu.works',
  'docker compose -f https://lumenvault.linyu.works/compose.yml up -d',
  '[{"label":"单张 6000 万像素 RAW 缩略生成","value":"110 ms","context":"Rust LibRaw + Display P3 色彩管线"},{"label":"支持主流相机原始格式","value":"320+ 款","context":"ARW · CR3 · NEF · RAF · DNG 全覆盖"},{"label":"画廊首屏 LCP 加载时间","value":"0.6 s","context":"AVIF 渐进式编码 + BlurHash 占位"}]',
  '[{"index":"01","title":"忠实还原 Display P3 与 HDR 宽容度","description":"端到端保留 ICC 色彩配置文件，在广色域显示器上准确再现胶片高光过渡与暗部层次，避免传统网盘偏色压缩。"},{"index":"02","title":"自动提取 EXIF 光圈快门与拍摄足迹","description":"无需手工标注即可按镜头焦段、胶片模拟配方、ISO 与经纬度足迹自由筛选作品，支持一键生成精选影展专题页。"},{"index":"03","title":"克制优雅的访客分享与选片批注","description":"可为客户生成带时效与密码保护的私人选片链接，支持高清无损对比、星级标记与逐帧视觉批注。"}]',
  '[{"layer":"影像解码与缩略管线","stack":"Rust · LibRaw · libvips · AVIF","note":"低内存流式转码，保护 NAS 硬盘寿命"},{"layer":"画廊与元数据索引","stack":"Next.js 15 · SQLite FTS5","note":"SEO 友好的公开影展静态页与秒级检索"},{"layer":"暗房前端交互","stack":"Motion · Canvas Histogram","note":"实时 RGB 亮度直方图与键盘盲操选片"}]',
  '[{"version":"v1.7.0","date":"2026.10","summary":"新增客户加密选片工作流与直方图高光溢出检测视图。"},{"version":"v1.4.0","date":"2026.04","summary":"全面支持 AVIF / JPEG XL 渐进式输出，带宽占用减少 58%。"},{"version":"v1.0.0","date":"2025.10","summary":"发布 Docker 一键私有化部署镜像与公开作品集画廊模式。"}]',
  '珍贵的摄影底片不该被困在封闭云相册里被反复压缩。光影相册把专业暗房的色彩严谨与美术馆策展的视觉克制合二为一，让你完全掌控自己的数字影像资产。',
  '后端采用 Rust 异步任务队列监听本地目录与 NAS 挂载卷，自动完成非破坏性 RAW 缩略图与 EXIF 建库；公开画廊页面由 Next.js 增量静态再生（ISR）提供极速 SEO 渲染与社交卡片预览。',
  1,
  'published',
  60,
  '2025-10-01T00:00:00.000Z',
  '2026-10-30T00:00:00.000Z'
);
