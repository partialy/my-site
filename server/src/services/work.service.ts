import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { WorkRepository, type WorkRow } from '../repositories/work.repository';
import { mapPageResult, paginationQueryShape, type PageResult } from '../shared/pagination';
import { createPublicId, publicIdSchema } from '../shared/public-id';
import { DictionaryService } from './dictionary.service';
import { FileService } from './file.service';

export const workIconKeys = ['orbit', 'feather', 'audio', 'layers', 'box', 'aperture'] as const;
export const workPlatforms = ['PC', 'Web', 'Android'] as const;
export const workStatuses = ['draft', 'published'] as const;

const metricSchema = z.strictObject({
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(30),
  context: z.string().trim().max(80).default(''),
});

const highlightSchema = z.strictObject({
  index: z.string().trim().min(1).max(10),
  title: z.string().trim().min(1).max(40),
  description: z.string().trim().min(1).max(200),
});

const techLayerSchema = z.strictObject({
  layer: z.string().trim().min(1).max(40),
  stack: z.string().trim().min(1).max(80),
  note: z.string().trim().max(120).default(''),
});

const releaseSchema = z.strictObject({
  version: z.string().trim().min(1).max(30),
  date: z.string().trim().min(1).max(20),
  summary: z.string().trim().min(1).max(200),
});

const optionalUrlOrPathSchema = z.string().trim().max(500).default('')
  .refine((val) => !val || val.startsWith('/') || /^https?:\/\//i.test(val), '请填写有效的 http(s) 链接或站内相对路径');

export const workUuidSchema = publicIdSchema;
export const workSlugOrUuidSchema = z.string().trim().min(1).max(100)
  .regex(/^[a-z0-9][a-z0-9-]*$/, '作品标识格式无效');

export const workInputSchema = z.strictObject({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符'),
  name: z.string().trim().min(1).max(60),
  enName: z.string().trim().min(1).max(80),
  shortTitle: z.string().trim().min(1).max(20),
  tagline: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(60),
  year: z.string().trim().min(4).max(12),
  version: z.string().trim().min(1).max(30),
  license: z.string().trim().min(1).max(40),
  platforms: z.array(z.enum(workPlatforms)).min(1).max(3),
  accentHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, '主题色须为 6 位十六进制颜色'),
  iconKey: z.enum(workIconKeys),
  iconImage: optionalUrlOrPathSchema,
  iconFileId: z.uuid().nullable().optional().default(null),
  heroImage: optionalUrlOrPathSchema,
  heroFileId: z.uuid().nullable().optional().default(null),
  heroAlt: z.string().trim().max(200).default(''),
  githubUrl: optionalUrlOrPathSchema,
  giteeUrl: optionalUrlOrPathSchema,
  websiteUrl: optionalUrlOrPathSchema,
  installCommand: z.string().trim().max(300).default(''),
  metrics: z.array(metricSchema).max(6).default([]),
  highlights: z.array(highlightSchema).max(6).default([]),
  techStack: z.array(techLayerSchema).max(8).default([]),
  releases: z.array(releaseSchema).max(20).default([]),
  detailIntro: z.string().trim().max(400).default(''),
  detailArchitecture: z.string().trim().max(500).default(''),
  featuredHome: z.boolean().default(true),
  status: z.enum(workStatuses).default('published'),
  sortOrder: z.number().int().min(0).max(1_000_000).default(0),
});

export type WorkInput = z.infer<typeof workInputSchema>;

export const adminWorkListQuerySchema = z.strictObject({
  ...paginationQueryShape,
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.enum(workStatuses).optional(),
  featuredHome: z.enum(['true', 'false']).optional().transform((v) => v === undefined ? undefined : v === 'true'),
});

export const publicWorkListQuerySchema = z.strictObject({
  ...paginationQueryShape,
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  featuredOnly: z.enum(['true', 'false']).optional().transform((v) => v === undefined ? undefined : v === 'true'),
});

export const reorderWorksSchema = z.strictObject({
  items: z.array(z.strictObject({
    uuid: workUuidSchema,
    sortOrder: z.number().int().min(0).max(1_000_000),
    featuredHome: z.boolean().optional(),
  })).min(1).max(100),
});

export interface WorkDto {
  uuid: string;
  id: string;
  slug: string;
  name: string;
  enName: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  category: string;
  categoryLabel: string;
  year: string;
  version: string;
  license: string;
  platforms: Array<typeof workPlatforms[number]>;
  accentHex: string;
  iconKey: typeof workIconKeys[number];
  iconImage: string;
  iconFileId: string | null;
  heroImage: string;
  heroFileId: string | null;
  heroAlt: string;
  links: {
    github: string;
    gitee: string;
    website: string;
  };
  installCommand: string;
  metrics: Array<z.infer<typeof metricSchema>>;
  highlights: Array<z.infer<typeof highlightSchema>>;
  techStack: Array<z.infer<typeof techLayerSchema>>;
  releases: Array<z.infer<typeof releaseSchema>>;
  detailIntro: string;
  detailArchitecture: string;
  featuredHome: boolean;
  status: 'draft' | 'published';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isUniqueSlugError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export class WorkService {
  constructor(
    private readonly repository: WorkRepository,
    private readonly dictionaries: DictionaryService,
    private readonly files: FileService,
  ) {}

  private buildCategoryLabelMap(): Map<string, string> {
    const group = this.dictionaries.getOptions(['work_category'], false).work_category;
    const map = new Map<string, string>();
    if (group) {
      for (const item of group.items) {
        map.set(item.value, item.label);
      }
    }
    return map;
  }

  private toDto(row: WorkRow, categoryLabels?: Map<string, string>): WorkDto {
    const labels = categoryLabels ?? this.buildCategoryLabelMap();
    return {
      uuid: row.uuid,
      id: row.slug,
      slug: row.slug,
      name: row.name,
      enName: row.en_name,
      shortTitle: row.short_title,
      tagline: row.tagline,
      summary: row.summary,
      category: row.category,
      categoryLabel: labels.get(row.category) ?? row.category,
      year: row.year,
      version: row.version,
      license: row.license,
      platforms: safeJsonParse(row.platforms_json, ['Web']),
      accentHex: row.accent_hex,
      iconKey: (workIconKeys.includes(row.icon_key as typeof workIconKeys[number]) ? row.icon_key : 'orbit') as typeof workIconKeys[number],
      iconImage: row.icon_image,
      iconFileId: row.icon_file_id,
      heroImage: row.hero_image,
      heroFileId: row.hero_file_id,
      heroAlt: row.hero_alt,
      links: {
        github: row.github_url,
        gitee: row.gitee_url,
        website: row.website_url,
      },
      installCommand: row.install_command,
      metrics: safeJsonParse(row.metrics_json, []),
      highlights: safeJsonParse(row.highlights_json, []),
      techStack: safeJsonParse(row.tech_stack_json, []),
      releases: safeJsonParse(row.releases_json, []),
      detailIntro: row.detail_intro,
      detailArchitecture: row.detail_architecture,
      featuredHome: row.featured_home === 1,
      status: row.status,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private resolveImageAsset(
    fileIdInput: string | null | undefined,
    urlInput: string,
    fieldName: 'heroFileId' | 'iconFileId',
    label: string,
  ): { imageUrl: string; fileId: string | null } {
    const fileId = fileIdInput ?? null;
    if (fileId) {
      const file = this.files.findActive(fileId);
      if (!file.mimeType.startsWith('image/')) {
        throw new ApiError(400, ApiCode.ValidationError, `${label}须为图片文件`, {
          fieldErrors: { [fieldName]: ['请选择图片类型的文件'] },
        });
      }
      return { imageUrl: file.url, fileId: file.id };
    }
    return { imageUrl: urlInput, fileId: null };
  }

  listAdmin(query: z.infer<typeof adminWorkListQuerySchema>): PageResult<WorkDto> {
    const labels = this.buildCategoryLabelMap();
    return mapPageResult(this.repository.list(query), (row) => this.toDto(row, labels));
  }

  getAdminByUuid(uuid: string): WorkDto {
    const row = this.repository.findByUuid(uuid);
    if (!row) throw new ApiError(404, ApiCode.NotFound, '作品不存在');
    return this.toDto(row);
  }

  listPublic(query: z.infer<typeof publicWorkListQuerySchema>): PageResult<WorkDto> {
    const labels = this.buildCategoryLabelMap();
    return mapPageResult(
      this.repository.list({
        offset: query.offset,
        limit: query.limit,
        search: query.search,
        category: query.category,
        status: 'published',
        featuredHome: query.featuredOnly ? true : undefined,
      }),
      (row) => this.toDto(row, labels),
    );
  }

  getPublicDetail(slugOrUuid: string): { work: WorkDto; prevWork: WorkDto; nextWork: WorkDto } {
    const labels = this.buildCategoryLabelMap();
    const publishedRows = this.repository.listAllPublished();
    const idx = publishedRows.findIndex((row) => row.slug === slugOrUuid || row.uuid === slugOrUuid);
    if (idx < 0) throw new ApiError(404, ApiCode.NotFound, '作品不存在或未发布');

    const total = publishedRows.length;
    return {
      work: this.toDto(publishedRows[idx]!, labels),
      prevWork: this.toDto(publishedRows[(idx - 1 + total) % total]!, labels),
      nextWork: this.toDto(publishedRows[(idx + 1) % total]!, labels),
    };
  }

  countPublished(): number {
    return this.repository.countPublished();
  }

  isFileReferenced(fileId: string): boolean {
    return this.repository.isFileReferenced(fileId);
  }

  create(input: WorkInput): WorkDto {
    const uuid = createPublicId();
    const cover = this.resolveImageAsset(input.heroFileId, input.heroImage, 'heroFileId', '作品封面');
    const icon = this.resolveImageAsset(input.iconFileId, input.iconImage, 'iconFileId', '轮盘图标');
    const now = new Date().toISOString();
    try {
      const row = this.repository.create({
        uuid,
        slug: input.slug,
        name: input.name,
        enName: input.enName,
        shortTitle: input.shortTitle,
        tagline: input.tagline,
        summary: input.summary,
        category: input.category,
        year: input.year,
        version: input.version,
        license: input.license,
        platformsJson: JSON.stringify(input.platforms),
        accentHex: input.accentHex,
        iconKey: input.iconKey,
        iconImage: icon.imageUrl,
        iconFileId: icon.fileId,
        heroImage: cover.imageUrl,
        heroFileId: cover.fileId,
        heroAlt: input.heroAlt,
        githubUrl: input.githubUrl,
        giteeUrl: input.giteeUrl,
        websiteUrl: input.websiteUrl,
        installCommand: input.installCommand,
        metricsJson: JSON.stringify(input.metrics),
        highlightsJson: JSON.stringify(input.highlights),
        techStackJson: JSON.stringify(input.techStack),
        releasesJson: JSON.stringify(input.releases),
        detailIntro: input.detailIntro,
        detailArchitecture: input.detailArchitecture,
        featuredHome: input.featuredHome ? 1 : 0,
        status: input.status,
        sortOrder: input.sortOrder,
        now,
      });
      return this.toDto(row);
    } catch (error) {
      if (isUniqueSlugError(error)) {
        throw new ApiError(409, ApiCode.ValidationError, '作品 Slug 已存在', {
          fieldErrors: { slug: ['该 Slug 已被其他作品占用'] },
        });
      }
      throw error;
    }
  }

  update(uuid: string, input: WorkInput): WorkDto {
    const existing = this.repository.findByUuid(uuid);
    if (!existing) throw new ApiError(404, ApiCode.NotFound, '作品不存在');

    const cover = this.resolveImageAsset(input.heroFileId, input.heroImage, 'heroFileId', '作品封面');
    const icon = this.resolveImageAsset(input.iconFileId, input.iconImage, 'iconFileId', '轮盘图标');
    const now = new Date().toISOString();
    try {
      const row = this.repository.update(uuid, {
        slug: input.slug,
        name: input.name,
        enName: input.enName,
        shortTitle: input.shortTitle,
        tagline: input.tagline,
        summary: input.summary,
        category: input.category,
        year: input.year,
        version: input.version,
        license: input.license,
        platformsJson: JSON.stringify(input.platforms),
        accentHex: input.accentHex,
        iconKey: input.iconKey,
        iconImage: icon.imageUrl,
        iconFileId: icon.fileId,
        heroImage: cover.imageUrl,
        heroFileId: cover.fileId,
        heroAlt: input.heroAlt,
        githubUrl: input.githubUrl,
        giteeUrl: input.giteeUrl,
        websiteUrl: input.websiteUrl,
        installCommand: input.installCommand,
        metricsJson: JSON.stringify(input.metrics),
        highlightsJson: JSON.stringify(input.highlights),
        techStackJson: JSON.stringify(input.techStack),
        releasesJson: JSON.stringify(input.releases),
        detailIntro: input.detailIntro,
        detailArchitecture: input.detailArchitecture,
        featuredHome: input.featuredHome ? 1 : 0,
        status: input.status,
        sortOrder: input.sortOrder,
        now,
      });
      if (!row) throw new ApiError(404, ApiCode.NotFound, '作品不存在');
      return this.toDto(row);
    } catch (error) {
      if (isUniqueSlugError(error)) {
        throw new ApiError(409, ApiCode.ValidationError, '作品 Slug 已存在', {
          fieldErrors: { slug: ['该 Slug 已被其他作品占用'] },
        });
      }
      throw error;
    }
  }

  delete(uuid: string): void {
    if (!this.repository.delete(uuid)) {
      throw new ApiError(404, ApiCode.NotFound, '作品不存在');
    }
  }

  reorder(items: z.infer<typeof reorderWorksSchema>['items']): void {
    this.repository.reorder(items, new Date().toISOString());
  }
}
