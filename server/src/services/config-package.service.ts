import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { ConfigManager, SysConfigKey } from '../config/config-manager';
import { ConfigPackageRepository } from '../repositories/config-package.repository';
import { createZip, parseZip } from '../shared/zip';
import { menuInputSchema, MenuService, validateMenuStructure } from './menu.service';
import { SystemConfigService } from './system-config.service';
import { workInputSchema } from './work.service';

const BUNDLE_FORMAT = 'mysite-config-bundle';
const BUNDLE_VERSION = 1;
const importedUuidSchema = z.string().trim().regex(/^[0-9a-f]{32}$/, '须为 32 位小写十六进制 UUID');

const manifestSchema = z.strictObject({
  format: z.literal(BUNDLE_FORMAT),
  version: z.literal(BUNDLE_VERSION),
  exportedAt: z.string().min(1),
  excludes: z.array(z.string()).optional(),
  counts: z.strictObject({
    works: z.number().int().min(0),
    sysConfigs: z.number().int().min(0),
    configs: z.number().int().min(0),
    menus: z.number().int().min(0),
    dictionaries: z.number().int().min(0),
  }).optional(),
});

const exportedWorkSchema = z.strictObject({
  uuid: importedUuidSchema,
  ...workInputSchema.shape,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const exportedSysConfigSchema = z.strictObject({
  key: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  value: z.unknown(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const exportedConfigSchema = z.strictObject({
  key: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  value: z.string().max(65_535),
  enabled: z.boolean(),
  remark: z.string().max(500).default(''),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const exportedDictionaryItemSchema = z.strictObject({
  uuid: importedUuidSchema,
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(100),
  sort: z.number().int().min(0),
  enabled: z.boolean(),
  color: z.string().trim().max(40).default('default'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const exportedDictionaryTypeSchema = z.strictObject({
  uuid: importedUuidSchema,
  code: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(100),
  remark: z.string().max(500).default(''),
  isPublic: z.boolean(),
  enabled: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  items: z.array(exportedDictionaryItemSchema).max(500),
});

export interface ConfigPackageImportResult {
  worksCount: number;
  sysConfigsCount: number;
  configsCount: number;
  menusCount: number;
  dictionariesCount: number;
  unlinkedFileRefs: number;
}

function safeJsonDecode(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function displayConfigValue(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function parseJsonArray<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readJsonEntry<T>(entries: Map<string, Buffer>, name: string, schema: z.ZodType<T>): T {
  const buf = entries.get(name);
  if (!buf) {
    throw new ApiError(400, ApiCode.ValidationError, `配置包缺少必需文件：${name}`, {
      fieldErrors: { file: [`配置包缺少必需文件 ${name}`] },
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(buf.toString('utf8')) as unknown;
  } catch {
    throw new ApiError(400, ApiCode.ValidationError, `配置包文件 JSON 格式无效：${name}`, {
      fieldErrors: { file: [`${name} 不是合法 JSON`] },
    });
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const detail = issue ? `${issue.path.join('.') || 'root'}: ${issue.message}` : '结构校验失败';
    throw new ApiError(400, ApiCode.ValidationError, `配置包文件 ${name} 校验失败（${detail}）`, {
      fieldErrors: { file: [`${name} 格式不符合要求：${detail}`] },
    });
  }
  return result.data;
}

function sanitizeSysConfigFileRefs(
  items: Array<z.infer<typeof exportedSysConfigSchema>>,
  existingFileIds: Set<string>,
): { sanitized: Array<z.infer<typeof exportedSysConfigSchema>>; unlinked: number } {
  let unlinked = 0;
  const sanitized = items.map((item) => {
    if (
      (item.key === SysConfigKey.AdminIconFileId || item.key === SysConfigKey.ClientIconFileId) &&
      typeof item.value === 'string' &&
      item.value &&
      !existingFileIds.has(item.value)
    ) {
      unlinked += 1;
      return { ...item, value: null };
    }

    if (item.key === SysConfigKey.AdminLoginAppearance && typeof item.value === 'object' && item.value !== null) {
      const obj = { ...(item.value as Record<string, unknown>) };
      if (typeof obj.backgroundFileId === 'string' && obj.backgroundFileId && !existingFileIds.has(obj.backgroundFileId)) {
        unlinked += 1;
        obj.backgroundFileId = null;
      }
      return { ...item, value: obj };
    }

    if (item.key === SysConfigKey.PortfolioProfileSettings && typeof item.value === 'object' && item.value !== null) {
      const profile = { ...(item.value as Record<string, unknown>) };
      if (typeof profile.site === 'object' && profile.site !== null) {
        const site = { ...(profile.site as Record<string, unknown>) };
        if (typeof site.ogImageFileId === 'string' && site.ogImageFileId && !existingFileIds.has(site.ogImageFileId)) {
          unlinked += 1;
          site.ogImageFileId = null;
        }
        profile.site = site;
      }
      return { ...item, value: profile };
    }

    return item;
  });

  return { sanitized, unlinked };
}

export class ConfigPackageService {
  constructor(
    private readonly repository: ConfigPackageRepository,
    private readonly configManager: ConfigManager,
    private readonly menus: MenuService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  exportZip(): { fileName: string; buffer: Buffer } {
    const snapshot = this.repository.exportSnapshot();
    const exportedAt = new Date().toISOString();

    const works = snapshot.works.map((row) => ({
      uuid: row.uuid,
      slug: row.slug,
      name: row.name,
      enName: row.en_name,
      shortTitle: row.short_title,
      tagline: row.tagline,
      summary: row.summary,
      category: row.category,
      year: row.year,
      version: row.version,
      license: row.license,
      platforms: parseJsonArray(row.platforms_json, ['Web']),
      accentHex: row.accent_hex,
      iconKey: row.icon_key,
      iconImage: row.icon_image,
      iconFileId: row.icon_file_id,
      heroImage: row.hero_image,
      heroFileId: row.hero_file_id,
      heroAlt: row.hero_alt,
      githubUrl: row.github_url,
      giteeUrl: row.gitee_url,
      websiteUrl: row.website_url,
      installCommand: row.install_command,
      metrics: parseJsonArray(row.metrics_json, []),
      highlights: parseJsonArray(row.highlights_json, []),
      techStack: parseJsonArray(row.tech_stack_json, []),
      releases: parseJsonArray(row.releases_json, []),
      detailIntro: row.detail_intro,
      detailArchitecture: row.detail_architecture,
      featuredHome: row.featured_home === 1,
      status: row.status,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const sysConfigs = snapshot.sysConfigs.map((row) => ({
      key: row.key,
      name: row.name,
      value: safeJsonDecode(row.value),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const configs = snapshot.configs.map((row) => ({
      key: row.key,
      name: row.name,
      value: displayConfigValue(row.value),
      enabled: row.enabled === 1,
      remark: row.remark,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const manifest = {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt,
      excludes: ['admin', 'visit', 'request_log', 'operation_log', 'file'],
      counts: {
        works: works.length,
        sysConfigs: sysConfigs.length,
        configs: configs.length,
        menus: snapshot.menus.length,
        dictionaries: snapshot.dictionaries.length,
      },
    };

    const buffer = createZip([
      { name: 'manifest.json', content: JSON.stringify(manifest, null, 2) },
      { name: 'works.json', content: JSON.stringify(works, null, 2) },
      { name: 'sys-configs.json', content: JSON.stringify(sysConfigs, null, 2) },
      { name: 'configs.json', content: JSON.stringify(configs, null, 2) },
      { name: 'menus.json', content: JSON.stringify(snapshot.menus, null, 2) },
      { name: 'dictionaries.json', content: JSON.stringify(snapshot.dictionaries, null, 2) },
    ]);

    const stamp = exportedAt.slice(0, 10);
    return {
      fileName: `mysite-config-${stamp}.zip`,
      buffer,
    };
  }

  importZip(zipBuffer: Buffer): ConfigPackageImportResult {
    let entries: Map<string, Buffer>;
    try {
      entries = parseZip(zipBuffer);
    } catch (error) {
      throw new ApiError(400, ApiCode.ValidationError, error instanceof Error ? error.message : 'ZIP 解析失败', {
        fieldErrors: { file: ['请上传合法的 .zip 配置包'] },
      });
    }

    readJsonEntry(entries, 'manifest.json', manifestSchema);
    const works = readJsonEntry(entries, 'works.json', z.array(exportedWorkSchema).max(500));
    const sysConfigs = readJsonEntry(entries, 'sys-configs.json', z.array(exportedSysConfigSchema).max(500));
    const configs = readJsonEntry(entries, 'configs.json', z.array(exportedConfigSchema).max(500));
    const menuItems = readJsonEntry(entries, 'menus.json', menuInputSchema.shape.items);
    const dictionaries = readJsonEntry(entries, 'dictionaries.json', z.array(exportedDictionaryTypeSchema).max(200));

    validateMenuStructure(menuItems);

    const slugSet = new Set<string>();
    const uuidSet = new Set<string>();
    for (const work of works) {
      if (slugSet.has(work.slug)) {
        throw new ApiError(400, ApiCode.ValidationError, `作品 Slug 重复：${work.slug}`, {
          fieldErrors: { file: [`works.json 中存在重复 slug: ${work.slug}`] },
        });
      }
      if (uuidSet.has(work.uuid)) {
        throw new ApiError(400, ApiCode.ValidationError, `作品 UUID 重复：${work.uuid}`, {
          fieldErrors: { file: [`works.json 中存在重复 uuid: ${work.uuid}`] },
        });
      }
      slugSet.add(work.slug);
      uuidSet.add(work.uuid);
    }

    const workCategoryDict = dictionaries.find((d) => d.code === 'work_category');
    if (workCategoryDict && workCategoryDict.items.length > 0) {
      const validCategories = new Set(workCategoryDict.items.map((item) => item.value));
      const invalidWork = works.find((work) => !validCategories.has(work.category));
      if (invalidWork) {
        throw new ApiError(
          400,
          ApiCode.ValidationError,
          `作品 ${invalidWork.name} 的分类「${invalidWork.category}」不在导入字典 work_category 中`,
          { fieldErrors: { file: [`无效作品分类：${invalidWork.category}`] } },
        );
      }
    }

    // 收集所有引用到的 fileId，对当前实例不存在的文件解绑关联并保留外链/路径 URL
    const candidateFileIds: string[] = [];
    for (const work of works) {
      if (work.heroFileId) candidateFileIds.push(work.heroFileId);
      if (work.iconFileId) candidateFileIds.push(work.iconFileId);
    }
    for (const cfg of sysConfigs) {
      if ((cfg.key === SysConfigKey.AdminIconFileId || cfg.key === SysConfigKey.ClientIconFileId) && typeof cfg.value === 'string') {
        candidateFileIds.push(cfg.value);
      }
      if (cfg.key === SysConfigKey.AdminLoginAppearance && typeof cfg.value === 'object' && cfg.value !== null) {
        const bgId = (cfg.value as Record<string, unknown>).backgroundFileId;
        if (typeof bgId === 'string') candidateFileIds.push(bgId);
      }
      if (cfg.key === SysConfigKey.PortfolioProfileSettings && typeof cfg.value === 'object' && cfg.value !== null) {
        const site = (cfg.value as Record<string, unknown>).site;
        if (typeof site === 'object' && site !== null) {
          const ogId = (site as Record<string, unknown>).ogImageFileId;
          if (typeof ogId === 'string') candidateFileIds.push(ogId);
        }
      }
    }

    const existingFileIds = this.repository.getExistingFileIds(candidateFileIds);
    let unlinkedFileRefs = 0;

    const now = new Date().toISOString();
    const workRows = works.map((work) => {
      let heroFileId = work.heroFileId ?? null;
      let iconFileId = work.iconFileId ?? null;
      if (heroFileId && !existingFileIds.has(heroFileId)) {
        heroFileId = null;
        unlinkedFileRefs += 1;
      }
      if (iconFileId && !existingFileIds.has(iconFileId)) {
        iconFileId = null;
        unlinkedFileRefs += 1;
      }
      return {
        uuid: work.uuid,
        slug: work.slug,
        name: work.name,
        enName: work.enName,
        shortTitle: work.shortTitle,
        tagline: work.tagline,
        summary: work.summary,
        category: work.category,
        year: work.year,
        version: work.version,
        license: work.license,
        platformsJson: JSON.stringify(work.platforms),
        accentHex: work.accentHex,
        iconKey: work.iconKey,
        iconImage: work.iconImage,
        iconFileId,
        heroImage: work.heroImage,
        heroFileId,
        heroAlt: work.heroAlt,
        githubUrl: work.githubUrl,
        giteeUrl: work.giteeUrl,
        websiteUrl: work.websiteUrl,
        installCommand: work.installCommand,
        metricsJson: JSON.stringify(work.metrics),
        highlightsJson: JSON.stringify(work.highlights),
        techStackJson: JSON.stringify(work.techStack),
        releasesJson: JSON.stringify(work.releases),
        detailIntro: work.detailIntro,
        detailArchitecture: work.detailArchitecture,
        featuredHome: work.featuredHome ? 1 : 0,
        status: work.status,
        sortOrder: work.sortOrder,
        now,
      };
    });

    const sanitizedSys = sanitizeSysConfigFileRefs(sysConfigs, existingFileIds);
    unlinkedFileRefs += sanitizedSys.unlinked;

    this.repository.applySnapshot({
      works: workRows,
      sysConfigs: sanitizedSys.sanitized.map((item) => ({
        key: item.key,
        name: item.name,
        value: JSON.stringify(item.value),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      configs: configs.map((item) => ({
        key: item.key,
        name: item.name,
        value: JSON.stringify(item.value),
        enabled: item.enabled,
        remark: item.remark,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      menus: menuItems,
      dictionaries,
      now,
    });

    // 同步刷新内存缓存与日志表
    this.configManager.reloadAll();
    this.menus.reload();
    this.systemConfig.syncAfterImport();

    return {
      worksCount: workRows.length,
      sysConfigsCount: sanitizedSys.sanitized.length,
      configsCount: configs.length,
      menusCount: menuItems.length,
      dictionariesCount: dictionaries.length,
      unlinkedFileRefs,
    };
  }
}
