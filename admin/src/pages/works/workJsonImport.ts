import type { WorkPayload, WorkPlatform } from '../../api/works';

export interface WorkJsonImportResult {
  patch: Partial<WorkPayload>;
  appliedCount: number;
  warnings: string[];
}

const VALID_PLATFORMS: readonly WorkPlatform[] = ['PC', 'Web', 'Android'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTrimmedString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key];
  return typeof val === 'string' ? val.trim() : undefined;
}

function clipText(value: string, maxLen: number, fieldLabel: string, warnings: string[]): string {
  if (value.length <= maxLen) return value;
  warnings.push(`${fieldLabel} 超过 ${maxLen} 字，已自动截断`);
  return value.slice(0, maxLen);
}

function isValidUrlOrPath(val: string): boolean {
  return val.startsWith('/') || /^https?:\/\//i.test(val);
}

function normalizePlatform(raw: string): WorkPlatform | null {
  const lower = raw.trim().toLowerCase();
  if (lower === 'pc' || lower === 'desktop' || lower === 'windows' || lower === 'macos' || lower === 'linux') return 'PC';
  if (lower === 'web' || lower === 'h5' || lower === 'browser' || lower === 'pwa') return 'Web';
  if (lower === 'android' || lower === 'apk') return 'Android';
  return VALID_PLATFORMS.find((item) => item.toLowerCase() === lower) ?? null;
}

function parseLinkValue(
  root: Record<string, unknown>,
  linksObj: Record<string, unknown> | null,
  linkKey: 'github' | 'gitee' | 'website',
  flatKey: 'githubUrl' | 'giteeUrl' | 'websiteUrl',
  warnings: string[],
): string | undefined {
  const raw = (linksObj ? readTrimmedString(linksObj, linkKey) : undefined) ?? readTrimmedString(root, flatKey);
  if (raw === undefined) return undefined;
  if (raw === '') return '';
  if (!isValidUrlOrPath(raw)) {
    warnings.push(`${flatKey} 不是合法的 http(s) 链接或站内路径，已忽略`);
    return undefined;
  }
  return clipText(raw, 500, flatKey, warnings);
}

export function parseWorkJsonImport(
  rawText: string,
  allowedCategories?: ReadonlySet<string>,
): WorkJsonImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('JSON 解析失败，请检查文件是否为合法的 UTF-8 JSON 格式');
  }

  if (!isRecord(parsed)) {
    throw new Error('JSON 根节点必须是一个对象（{ ... }）');
  }

  const root = isRecord(parsed.work) ? parsed.work : parsed;
  const warnings: string[] = [];
  const patch: Partial<WorkPayload> = {};
  let appliedCount = 0;

  const setString = (
    key: keyof Pick<
      WorkPayload,
      | 'slug'
      | 'name'
      | 'enName'
      | 'shortTitle'
      | 'tagline'
      | 'summary'
      | 'year'
      | 'version'
      | 'license'
      | 'heroAlt'
      | 'installCommand'
      | 'detailIntro'
      | 'detailArchitecture'
    >,
    maxLen: number,
    label: string,
  ) => {
    const val = readTrimmedString(root, key);
    if (val === undefined) return;
    if (key === 'slug') {
      const normalized = val.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
        warnings.push('slug 格式无效，仅支持小写字母、数字和连字符');
        return;
      }
      patch.slug = clipText(normalized, maxLen, label, warnings);
      appliedCount += 1;
      return;
    }
    patch[key] = clipText(val, maxLen, label, warnings);
    appliedCount += 1;
  };

  setString('slug', 60, 'URL Slug');
  setString('name', 60, '作品中文名');
  setString('enName', 80, '作品英文名');
  setString('shortTitle', 20, '轮盘短标题');
  setString('tagline', 80, '一句话标语');
  setString('summary', 300, '作品简介');
  setString('year', 12, '年份');
  setString('version', 30, '当前版本');
  setString('license', 40, '开源协议');
  setString('heroAlt', 200, '封面 Alt 描述');
  setString('installCommand', 300, '快速安装命令');
  setString('detailIntro', 400, '设计缘起/导语');
  setString('detailArchitecture', 500, '工程架构概述');

  if (patch.shortTitle && patch.shortTitle.length > 10) {
    warnings.push('轮盘短标题建议不超过 10 个字符（最佳 4~6 字），避免首页轮盘显示过宽');
  }

  const category = readTrimmedString(root, 'category');
  if (category) {
    if (allowedCategories && allowedCategories.size > 0 && !allowedCategories.has(category)) {
      warnings.push(`作品分类 "${category}" 未在字典 work_category 中定义，请手动选择分类`);
    } else {
      patch.category = clipText(category, 60, '作品分类', warnings);
      appliedCount += 1;
    }
  }

  const accentHex = readTrimmedString(root, 'accentHex');
  if (accentHex) {
    if (/^#[0-9a-fA-F]{6}$/.test(accentHex)) {
      patch.accentHex = accentHex.toUpperCase();
      appliedCount += 1;
    } else {
      warnings.push('accentHex 须为 6 位十六进制颜色（如 #E5A93C），已保留原主题色');
    }
  }

  if (Array.isArray(root.platforms)) {
    const mapped = Array.from(
      new Set(
        root.platforms
          .filter((item): item is string => typeof item === 'string')
          .map(normalizePlatform)
          .filter((item): item is WorkPlatform => item !== null),
      ),
    ).slice(0, 3);
    if (mapped.length > 0) {
      patch.platforms = mapped;
      appliedCount += 1;
    } else {
      warnings.push('platforms 未匹配到有效的 PC / Web / Android 选项，已保留当前选择');
    }
  }

  // 图片仅在 JSON 显式提供非空外链/路径时才覆盖，否则保留当前编辑状态中的图片与 fileId
  const heroImage = readTrimmedString(root, 'heroImage');
  if (heroImage) {
    if (isValidUrlOrPath(heroImage)) {
      patch.heroImage = clipText(heroImage, 500, '封面图片', warnings);
      patch.heroFileId = null;
      appliedCount += 1;
    } else {
      warnings.push('heroImage 不是合法 URL 或站内路径，已保留原封面图设置');
    }
  }

  const iconImage = readTrimmedString(root, 'iconImage');
  if (iconImage) {
    if (isValidUrlOrPath(iconImage)) {
      patch.iconImage = clipText(iconImage, 500, '轮盘 AppIcon', warnings);
      patch.iconFileId = null;
      appliedCount += 1;
    } else {
      warnings.push('iconImage 不是合法 URL 或站内路径，已保留原图标设置');
    }
  }

  const linksObj = isRecord(root.links) ? root.links : null;
  const githubUrl = parseLinkValue(root, linksObj, 'github', 'githubUrl', warnings);
  const giteeUrl = parseLinkValue(root, linksObj, 'gitee', 'giteeUrl', warnings);
  const websiteUrl = parseLinkValue(root, linksObj, 'website', 'websiteUrl', warnings);
  if (githubUrl !== undefined) { patch.githubUrl = githubUrl; appliedCount += 1; }
  if (giteeUrl !== undefined) { patch.giteeUrl = giteeUrl; appliedCount += 1; }
  if (websiteUrl !== undefined) { patch.websiteUrl = websiteUrl; appliedCount += 1; }

  if (Array.isArray(root.metrics)) {
    const metrics = root.metrics
      .filter(isRecord)
      .map((item) => ({
        label: clipText(readTrimmedString(item, 'label') ?? '', 40, '指标名称', warnings),
        value: clipText(readTrimmedString(item, 'value') ?? '', 30, '指标数值', warnings),
        context: clipText(readTrimmedString(item, 'context') ?? '', 80, '指标说明', warnings),
      }))
      .filter((item) => item.label && item.value)
      .slice(0, 6);
    if (metrics.length > 0) {
      patch.metrics = metrics;
      appliedCount += 1;
    }
  }

  if (Array.isArray(root.highlights)) {
    const highlights = root.highlights
      .filter(isRecord)
      .map((item, idx) => ({
        index: clipText(readTrimmedString(item, 'index') || `0${idx + 1}`, 10, '亮点序号', warnings),
        title: clipText(readTrimmedString(item, 'title') ?? '', 40, '亮点标题', warnings),
        description: clipText(readTrimmedString(item, 'description') ?? '', 200, '亮点详情', warnings),
      }))
      .filter((item) => item.title && item.description)
      .slice(0, 6);
    if (highlights.length > 0) {
      patch.highlights = highlights;
      appliedCount += 1;
    }
  }

  if (Array.isArray(root.techStack)) {
    const techStack = root.techStack
      .filter(isRecord)
      .map((item) => ({
        layer: clipText(readTrimmedString(item, 'layer') ?? '', 40, '架构层级', warnings),
        stack: clipText(readTrimmedString(item, 'stack') ?? '', 80, '技术栈', warnings),
        note: clipText(readTrimmedString(item, 'note') ?? '', 120, '技术说明', warnings),
      }))
      .filter((item) => item.layer && item.stack)
      .slice(0, 8);
    if (techStack.length > 0) {
      patch.techStack = techStack;
      appliedCount += 1;
    }
  }

  if (Array.isArray(root.releases)) {
    const releases = root.releases
      .filter(isRecord)
      .map((item) => ({
        version: clipText(readTrimmedString(item, 'version') ?? '', 30, '版本号', warnings),
        date: clipText(readTrimmedString(item, 'date') ?? '', 20, '发布日期', warnings),
        summary: clipText(readTrimmedString(item, 'summary') ?? '', 200, '更新摘要', warnings),
      }))
      .filter((item) => item.version && item.date && item.summary)
      .slice(0, 20);
    if (releases.length > 0) {
      patch.releases = releases;
      appliedCount += 1;
    }
  }

  if (appliedCount === 0) {
    throw new Error('未在 JSON 中识别到可填充的作品字段，请对照 WORK_JSON_RULE.md 检查字段名');
  }

  return { patch, appliedCount, warnings };
}

export const WORK_JSON_TEMPLATE = {
  slug: 'my-awesome-project',
  name: '示例作品名称',
  enName: 'AwesomeProject',
  shortTitle: '示例作品',
  tagline: '一句话概括作品核心定位与价值（建议 12~28 字）',
  summary: '用于首页首屏与作品列表展示的简洁介绍，突出解决了什么问题、采用了什么核心能力与设计特点，建议控制在 80~120 字之间。',
  category: 'dev-tool',
  year: String(new Date().getFullYear()),
  version: 'v1.0.0',
  license: 'MIT',
  platforms: ['PC', 'Web'],
  accentHex: '#4F8BFF',
  heroAlt: '项目核心界面预览截图说明（供无障碍与 SEO 使用）',
  links: {
    github: 'https://github.com/your-org/your-repo',
    gitee: '',
    website: '',
  },
  installCommand: 'npm install your-package',
  detailIntro: '阐述项目的创作背景、解决的痛点与设计哲学，将显示在首页第 2 屏及详情页开篇。',
  detailArchitecture: '概括前后端分层、数据流转与核心工程架构决策，将显示在首页第 3 屏及详情页架构章节。',
  metrics: [
    { label: '冷启动耗时', value: '18 ms', context: 'Apple M2 / 本地发布构建' },
    { label: '包体大小', value: '42 KB', context: 'Gzip 压缩后核心产物' },
    { label: '核心模块覆盖', value: '100%', context: 'TypeScript 严格模式校验' },
  ],
  highlights: [
    { index: '01', title: '核心能力亮点一', description: '说明该特性如何提升开发或使用体验，建议 40~70 字。' },
    { index: '02', title: '核心能力亮点二', description: '说明底层机制或交互细节上的独到之处，建议 40~70 字。' },
    { index: '03', title: '核心能力亮点三', description: '说明可扩展性、兼容性或工程化规范保障，建议 40~70 字。' },
  ],
  techStack: [
    { layer: '交互层', stack: 'React 18 · TypeScript', note: '组件化与类型安全渲染' },
    { layer: '状态与通信', stack: 'REST API · Zod', note: '契约校验与统一错误处理' },
    { layer: '构建与部署', stack: 'Vite · Docker', note: '多阶段镜像与静态缓存' },
  ],
  releases: [
    { version: 'v1.0.0', date: `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}`, summary: '首个正式版本发布，完成核心功能链路与工程化架构落地。' },
  ],
};

export function downloadWorkJsonTemplate(): void {
  const blob = new Blob([JSON.stringify(WORK_JSON_TEMPLATE, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'work-template.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
