import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';
import { FileService } from './file.service';

const urlOrRelativeSchema = z.string().trim().min(1).max(500)
  .refine((val) => val.startsWith('/') || /^https?:\/\//i.test(val), '请填写有效的 http(s) 链接或站内相对路径');

const principleSchema = z.strictObject({
  index: z.string().trim().min(1).max(10),
  title: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(300),
});

export const profileSettingsSchema = z.strictObject({
  site: z.strictObject({
    brandName: z.string().trim().min(1).max(60),
    brandEn: z.string().trim().min(1).max(60),
    domainLabel: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(300),
    keywords: z.array(z.string().trim().min(1).max(40)).max(20),
    url: z.url(),
    ogImage: urlOrRelativeSchema,
    ogImageFileId: z.uuid().nullable().optional().default(null),
  }),
  footer: z.strictObject({
    years: z.string().trim().min(1).max(30),
    owner: z.string().trim().min(1).max(60),
    domain: z.string().trim().min(1).max(100),
    domainHref: z.url(),
    icpNumber: z.string().trim().max(80).default(''),
    icpHref: z.url(),
  }),
  about: z.strictObject({
    authorName: z.string().trim().min(1).max(60),
    authorRole: z.string().trim().min(1).max(100),
    location: z.string().trim().min(1).max(60),
    email: z.email(),
    bio: z.string().trim().min(1).max(500),
    principles: z.array(principleSchema).max(6),
  }),
});

export type ProfileSettingsData = z.infer<typeof profileSettingsSchema>;

export const DEFAULT_PROFILE_SETTINGS: ProfileSettingsData = {
  site: {
    brandName: 'MySite',
    brandEn: 'MySite',
    domainLabel: 'partialy.cn',
    title: 'MySite — 独立开发者个人主页与开源作品展厅',
    description: '探索 MySite 打造的开源软件、桌面效率工具、出版级排版引擎与前端设计系统。支持源码查阅、架构解析与在线体验。',
    keywords: [
      '独立开发者主页',
      '作品集',
      '开源项目',
      'Next.js 作品展厅',
      '星轨笔记',
      '墨韵排版',
      '砚台组件',
      'MySite',
    ],
    url: 'https://partialy.cn',
    ogImage: '/images/works/orbitnote.jpg',
    ogImageFileId: null,
  },
  footer: {
    years: '2025-2026',
    owner: 'Partial',
    domain: 'partialy.cn',
    domainHref: 'https://partialy.cn',
    icpNumber: '京ICP xxxxx号',
    icpHref: 'https://beian.miit.gov.cn/',
  },
  about: {
    authorName: 'Partial',
    authorRole: '独立全栈开发者与数字界面工艺设计师',
    location: '杭州 · 上海',
    email: 'hello@partialy.cn',
    bio: '专注于打造兼具工程性能与视觉克制力的独立软件与开源工具。技术栈横跨 TypeScript、Next.js、Rust、WebAssembly 与 Go，持续探索人机交互中的空间隐喻与流畅动效。',
    principles: [
      {
        index: '01',
        title: '本地优先与数据主权',
        body: '软件应当忠实服务于创作者，而非将用户数据囚禁在封闭私有格式中。所有效率工具坚持明文可迁移与端到端加密。',
      },
      {
        index: '02',
        title: '精准动效与克制视觉',
        body: '拒绝哗众取宠的堆砌与高饱和干扰，以精密的贝塞尔缓动曲线、清晰排版层级与留白秩序建立持久耐看的数字工艺。',
      },
      {
        index: '03',
        title: '原生 SEO 与工程可维护性',
        body: '采用 Next.js App Router 服务端渲染与结构化数据标准，让每一件独立作品都能被搜索引擎与全球开发者顺畅发现。',
      },
    ],
  },
};

export class ProfileSettingsService {
  constructor(
    private readonly manager: ConfigManager,
    private readonly files: FileService,
  ) {}

  get(): ProfileSettingsData {
    const saved = profileSettingsSchema.safeParse(
      this.manager.getSysConfig().get(SysConfigKey.PortfolioProfileSettings),
    );
    const data = saved.success ? saved.data : DEFAULT_PROFILE_SETTINGS;
    if (data.site.ogImageFileId) {
      try {
        const file = this.files.find(data.site.ogImageFileId);
        return { ...data, site: { ...data.site, ogImage: file.url } };
      } catch {
        return data;
      }
    }
    return data;
  }

  update(input: ProfileSettingsData): ProfileSettingsData {
    let resolvedOgImage = input.site.ogImage;
    let resolvedOgFileId = input.site.ogImageFileId ?? null;

    if (resolvedOgFileId) {
      const file = this.files.findActive(resolvedOgFileId);
      if (!file.mimeType.startsWith('image/')) {
        throw new ApiError(400, ApiCode.ValidationError, 'OG 分享图须为图片文件', {
          fieldErrors: { ogImageFileId: ['请选择图片类型的文件'] },
        });
      }
      resolvedOgImage = file.url;
    } else {
      resolvedOgFileId = null;
    }

    const nextValue: ProfileSettingsData = {
      ...input,
      site: {
        ...input.site,
        ogImage: resolvedOgImage,
        ogImageFileId: resolvedOgFileId,
      },
    };
    this.manager.setSysConfig(SysConfigKey.PortfolioProfileSettings, '个人主页与关于页配置', nextValue);
    return this.get();
  }

  isFileReferenced(fileId: string): boolean {
    const current = this.get();
    return current.site.ogImageFileId === fileId;
  }
}
