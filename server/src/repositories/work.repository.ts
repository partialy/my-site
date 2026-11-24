import type Database from 'better-sqlite3';
import { createPageResult, type PageResult, type PaginationQuery } from '../shared/pagination';

export interface WorkRow {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  en_name: string;
  short_title: string;
  tagline: string;
  summary: string;
  category: string;
  year: string;
  version: string;
  license: string;
  platforms_json: string;
  accent_hex: string;
  icon_key: string;
  icon_image: string;
  icon_file_id: string | null;
  hero_image: string;
  hero_file_id: string | null;
  hero_alt: string;
  github_url: string;
  gitee_url: string;
  website_url: string;
  install_command: string;
  metrics_json: string;
  highlights_json: string;
  tech_stack_json: string;
  releases_json: string;
  detail_intro: string;
  detail_architecture: string;
  featured_home: number;
  status: 'draft' | 'published';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SaveWorkRowInput {
  uuid: string;
  slug: string;
  name: string;
  enName: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  category: string;
  year: string;
  version: string;
  license: string;
  platformsJson: string;
  accentHex: string;
  iconKey: string;
  iconImage: string;
  iconFileId: string | null;
  heroImage: string;
  heroFileId: string | null;
  heroAlt: string;
  githubUrl: string;
  giteeUrl: string;
  websiteUrl: string;
  installCommand: string;
  metricsJson: string;
  highlightsJson: string;
  techStackJson: string;
  releasesJson: string;
  detailIntro: string;
  detailArchitecture: string;
  featuredHome: number;
  status: 'draft' | 'published';
  sortOrder: number;
  now: string;
}

export interface WorkListFilter extends PaginationQuery {
  search?: string;
  category?: string;
  status?: 'draft' | 'published';
  featuredHome?: boolean;
}

function escapeLike(value: string): string {
  return `%${value.replace(/[!%_]/g, '!$&')}%`;
}

export class WorkRepository {
  constructor(private readonly db: Database.Database) {}

  list(filter: WorkListFilter): PageResult<WorkRow> {
    const conditions: string[] = [];
    const args: Array<string | number> = [];

    if (filter.status) {
      conditions.push('status = ?');
      args.push(filter.status);
    }
    if (filter.category) {
      conditions.push('category = ?');
      args.push(filter.category);
    }
    if (filter.featuredHome !== undefined) {
      conditions.push('featured_home = ?');
      args.push(filter.featuredHome ? 1 : 0);
    }
    if (filter.search) {
      const pattern = escapeLike(filter.search);
      conditions.push(`(
        name LIKE ? ESCAPE '!' OR
        en_name LIKE ? ESCAPE '!' OR
        short_title LIKE ? ESCAPE '!' OR
        slug LIKE ? ESCAPE '!' OR
        tagline LIKE ? ESCAPE '!' OR
        summary LIKE ? ESCAPE '!' OR
        tech_stack_json LIKE ? ESCAPE '!'
      )`);
      args.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS total FROM work${where}`).get(...args) as { total: number }).total;
    const rows = this.db.prepare(`
      SELECT * FROM work${where}
      ORDER BY sort_order ASC, id ASC
      LIMIT ? OFFSET ?
    `).all(...args, filter.limit, filter.offset) as WorkRow[];

    return createPageResult(rows, total, filter);
  }

  listAllPublished(): WorkRow[] {
    return this.db.prepare(`
      SELECT * FROM work
      WHERE status = 'published'
      ORDER BY sort_order ASC, id ASC
    `).all() as WorkRow[];
  }

  countPublished(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS total FROM work WHERE status = 'published'").get() as { total: number };
    return row.total;
  }

  findByUuid(uuid: string): WorkRow | null {
    return (this.db.prepare('SELECT * FROM work WHERE uuid = ?').get(uuid) as WorkRow | undefined) ?? null;
  }

  findPublishedBySlugOrUuid(slugOrUuid: string): WorkRow | null {
    return (this.db.prepare(`
      SELECT * FROM work
      WHERE status = 'published' AND (slug = ? OR uuid = ?)
      LIMIT 1
    `).get(slugOrUuid, slugOrUuid) as WorkRow | undefined) ?? null;
  }

  isFileReferenced(fileId: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM work WHERE hero_file_id = ? OR icon_file_id = ? LIMIT 1').get(fileId, fileId);
    return Boolean(row);
  }

  create(input: SaveWorkRowInput): WorkRow {
    this.db.prepare(`
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
    `).run(input);
    return this.findByUuid(input.uuid)!;
  }

  update(uuid: string, input: Omit<SaveWorkRowInput, 'uuid'>): WorkRow | null {
    const result = this.db.prepare(`
      UPDATE work SET
        slug = @slug,
        name = @name,
        en_name = @enName,
        short_title = @shortTitle,
        tagline = @tagline,
        summary = @summary,
        category = @category,
        year = @year,
        version = @version,
        license = @license,
        platforms_json = @platformsJson,
        accent_hex = @accentHex,
        icon_key = @iconKey,
        icon_image = @iconImage,
        icon_file_id = @iconFileId,
        hero_image = @heroImage,
        hero_file_id = @heroFileId,
        hero_alt = @heroAlt,
        github_url = @githubUrl,
        gitee_url = @giteeUrl,
        website_url = @websiteUrl,
        install_command = @installCommand,
        metrics_json = @metricsJson,
        highlights_json = @highlightsJson,
        tech_stack_json = @techStackJson,
        releases_json = @releasesJson,
        detail_intro = @detailIntro,
        detail_architecture = @detailArchitecture,
        featured_home = @featuredHome,
        status = @status,
        sort_order = @sortOrder,
        updated_at = @now
      WHERE uuid = @uuid
    `).run({ ...input, uuid });
    return result.changes > 0 ? this.findByUuid(uuid) : null;
  }

  delete(uuid: string): boolean {
    return this.db.prepare('DELETE FROM work WHERE uuid = ?').run(uuid).changes > 0;
  }

  reorder(items: Array<{ uuid: string; sortOrder: number; featuredHome?: boolean }>, now: string): void {
    const updateSort = this.db.prepare('UPDATE work SET sort_order = ?, updated_at = ? WHERE uuid = ?');
    const updateWithFeatured = this.db.prepare('UPDATE work SET sort_order = ?, featured_home = ?, updated_at = ? WHERE uuid = ?');
    this.db.transaction(() => {
      for (const item of items) {
        if (item.featuredHome === undefined) {
          updateSort.run(item.sortOrder, now, item.uuid);
        } else {
          updateWithFeatured.run(item.sortOrder, item.featuredHome ? 1 : 0, now, item.uuid);
        }
      }
    })();
  }
}
