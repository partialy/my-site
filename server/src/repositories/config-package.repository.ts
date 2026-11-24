import type Database from 'better-sqlite3';
import type { ConfigRecord, SysConfigRecord } from './config.repository';
import type { DictionaryType } from './dictionary.repository';
import { DictionaryRepository } from './dictionary.repository';
import type { MenuRecord } from './menu.repository';
import { MenuRepository } from './menu.repository';
import type { SaveWorkRowInput, WorkRow } from './work.repository';

export interface ConfigPackageSnapshot {
  works: WorkRow[];
  sysConfigs: SysConfigRecord[];
  configs: ConfigRecord[];
  menus: MenuRecord[];
  dictionaries: DictionaryType[];
}

export interface ConfigPackageApplyPayload {
  works: SaveWorkRowInput[];
  sysConfigs: Array<{ key: string; name: string; value: string; createdAt?: string; updatedAt?: string }>;
  configs: Array<{ key: string; name: string; value: string; enabled: boolean; remark: string; createdAt?: string; updatedAt?: string }>;
  menus: MenuRecord[];
  dictionaries: Array<{
    uuid: string;
    code: string;
    name: string;
    remark: string;
    isPublic: boolean;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
    items: Array<{
      uuid: string;
      label: string;
      value: string;
      sort: number;
      enabled: boolean;
      color: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }>;
  now: string;
}

export class ConfigPackageRepository {
  private readonly menus: MenuRepository;
  private readonly dictionaries: DictionaryRepository;

  constructor(private readonly db: Database.Database) {
    this.menus = new MenuRepository(db);
    this.dictionaries = new DictionaryRepository(db);
  }

  exportSnapshot(): ConfigPackageSnapshot {
    const works = this.db.prepare('SELECT * FROM work ORDER BY sort_order ASC, id ASC').all() as WorkRow[];
    const sysConfigs = this.db.prepare('SELECT * FROM sys_config ORDER BY key ASC').all() as SysConfigRecord[];
    const configs = this.db.prepare('SELECT * FROM config ORDER BY key ASC').all() as ConfigRecord[];
    const menus = this.menus.list();
    const dictionaries = this.dictionaries.list();
    return { works, sysConfigs, configs, menus, dictionaries };
  }

  getExistingFileIds(fileIds: string[]): Set<string> {
    const unique = Array.from(new Set(fileIds.filter(Boolean)));
    if (unique.length === 0) return new Set();
    const placeholders = unique.map(() => '?').join(', ');
    const rows = this.db.prepare(`SELECT id FROM file WHERE id IN (${placeholders}) AND archived_at IS NULL`).all(...unique) as Array<{ id: string }>;
    return new Set(rows.map((row) => row.id));
  }

  applySnapshot(payload: ConfigPackageApplyPayload): void {
    const { now } = payload;

    this.db.transaction(() => {
      // 1. 字典类型与字典项（保持原有引用结构重建）
      this.db.prepare('DELETE FROM dict_item').run();
      this.db.prepare('DELETE FROM dict_type').run();
      const insertDictType = this.db.prepare(`
        INSERT INTO dict_type (uuid, code, name, remark, is_public, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertDictItem = this.db.prepare(`
        INSERT INTO dict_item (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const dict of payload.dictionaries) {
        const typeCreatedAt = dict.createdAt || now;
        const typeUpdatedAt = dict.updatedAt || now;
        const result = insertDictType.run(
          dict.uuid,
          dict.code,
          dict.name,
          dict.remark,
          Number(dict.isPublic),
          Number(dict.enabled),
          typeCreatedAt,
          typeUpdatedAt,
        );
        const typeId = Number(result.lastInsertRowid);
        for (const item of dict.items) {
          insertDictItem.run(
            item.uuid,
            typeId,
            item.label,
            item.value,
            item.sort,
            Number(item.enabled),
            item.color,
            item.createdAt || now,
            item.updatedAt || now,
          );
        }
      }

      // 2. 菜单配置
      this.db.prepare('DELETE FROM menu').run();
      const insertMenu = this.db.prepare(`
        INSERT INTO menu (key, label, type, parent_key, path, action, icon, sort, visible)
        VALUES (@key, @label, @type, @parentKey, @path, @action, @icon, @sort, @visible)
      `);
      for (const item of payload.menus) {
        insertMenu.run({ ...item, visible: item.visible ? 1 : 0 });
      }

      // 3. 普通配置
      this.db.prepare('DELETE FROM config').run();
      const insertConfig = this.db.prepare(`
        INSERT INTO config (key, name, value, enabled, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const cfg of payload.configs) {
        insertConfig.run(
          cfg.key,
          cfg.name,
          cfg.value,
          Number(cfg.enabled),
          cfg.remark,
          cfg.createdAt || now,
          cfg.updatedAt || now,
        );
      }

      // 4. 系统内部配置（包含主页配置 portfolio_profile_settings、日志配置、外观配置、上传设置等）
      this.db.prepare('DELETE FROM sys_config').run();
      const insertSysConfig = this.db.prepare(`
        INSERT INTO sys_config (key, name, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      let hasMenuInitFlag = false;
      for (const item of payload.sysConfigs) {
        if (item.key === 'menu_initialized') hasMenuInitFlag = true;
        insertSysConfig.run(item.key, item.name, item.value, item.createdAt || now, item.updatedAt || now);
      }
      if (!hasMenuInitFlag) {
        insertSysConfig.run('menu_initialized', '菜单初始化标记', 'true', now, now);
      }

      // 5. 作品数据
      this.db.prepare('DELETE FROM work').run();
      const insertWork = this.db.prepare(`
        INSERT INTO work (
          uuid, slug, name, en_name, short_title, tagline, summary,
          category, year, version, license, platforms_json, accent_hex, icon_key,
          icon_image, icon_file_id,
          hero_image, hero_file_id, hero_alt, github_url, gitee_url, website_url, install_command,
          metrics_json, highlights_json, tech_stack_json, releases_json,
          detail_intro, detail_architecture, featured_home, status, sort_order, created_at, updated_at
        ) VALUES (
          @uuid, @slug, @name, @enName, @shortTitle, @tagline, @summary,
          @category, @year, @version, @license, @platformsJson, @accentHex, @iconKey,
          @iconImage, @iconFileId,
          @heroImage, @heroFileId, @heroAlt, @githubUrl, @giteeUrl, @websiteUrl, @installCommand,
          @metricsJson, @highlightsJson, @techStackJson, @releasesJson,
          @detailIntro, @detailArchitecture, @featuredHome, @status, @sortOrder, @now, @now
        )
      `);
      for (const work of payload.works) {
        insertWork.run(work);
      }
    })();
  }
}
