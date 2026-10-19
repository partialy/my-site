import type Database from 'better-sqlite3';

export interface FileRecord {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  storage_name: string;
  created_at: string;
  archived_at: string | null;
}

export interface FileListQuery {
  page: number;
  pageSize: number;
  search?: string;
  mimeTypes?: string[];
}

export class FileRepository {
  constructor(private readonly db: Database.Database) {}

  list(query: FileListQuery): { items: FileRecord[]; total: number } {
    const search = query.search ? `%${query.search.replace(/[!%_]/g, '!$&')}%` : null;
    const where = "archived_at IS NULL AND (@search IS NULL OR name LIKE @search ESCAPE '!') AND (@mimeTypes IS NULL OR mime_type IN (SELECT value FROM json_each(@mimeTypes)))";
    const params = { search, mimeTypes: query.mimeTypes ? JSON.stringify(query.mimeTypes) : null };
    const total = (this.db.prepare(`SELECT COUNT(*) AS count FROM file WHERE ${where}`).get(params) as { count: number }).count;
    const items = this.db.prepare(`SELECT * FROM file WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: query.pageSize, offset: (query.page - 1) * query.pageSize }) as FileRecord[];
    return { items, total };
  }

  find(id: string): FileRecord | null {
    return (this.db.prepare('SELECT * FROM file WHERE id = ?').get(id) as FileRecord | undefined) ?? null;
  }

  findActive(id: string): FileRecord | null {
    return (this.db.prepare('SELECT * FROM file WHERE id = ? AND archived_at IS NULL').get(id) as FileRecord | undefined) ?? null;
  }

  create(record: Omit<FileRecord, 'archived_at'>): void {
    this.db.prepare(`INSERT INTO file (id, name, mime_type, size, storage_name, created_at)
      VALUES (@id, @name, @mime_type, @size, @storage_name, @created_at)`).run(record);
  }

  archive(id: string): boolean {
    return this.db.prepare('UPDATE file SET archived_at = ? WHERE id = ? AND archived_at IS NULL')
      .run(new Date().toISOString(), id).changes > 0;
  }
}
