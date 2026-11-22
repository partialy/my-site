import type Database from 'better-sqlite3';
import type { PageResult, PaginationQuery } from '../shared/pagination';
import { TableListRepository } from './table-list.repository';
import { fileListResourceForSort } from './resources/file-list.resource';

export type FileSortBy = 'createdAt' | 'size';
export type FileSortOrder = 'asc' | 'desc';
export type FileListStatus = 'active' | 'archived' | 'all';

export interface FileRecord {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  storage_name: string;
  storage_provider: 'local' | 'qiniu';
  storage_bucket: string | null;
  storage_domain: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface FileListQuery extends PaginationQuery {
  search?: string;
  mimeTypes?: string[];
  sortBy?: FileSortBy;
  sortOrder?: FileSortOrder;
  status?: FileListStatus;
}

export class FileRepository {
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

  list(query: FileListQuery): PageResult<FileRecord> {
    return this.tableList.list<FileRecord, FileListQuery>(
      fileListResourceForSort(query.sortBy ?? 'createdAt', query.sortOrder ?? 'desc', query.status ?? 'active'), query,
    );
  }

  find(id: string): FileRecord | null {
    return (this.db.prepare('SELECT * FROM file WHERE id = ?').get(id) as FileRecord | undefined) ?? null;
  }

  findActive(id: string): FileRecord | null {
    return (this.db.prepare('SELECT * FROM file WHERE id = ? AND archived_at IS NULL').get(id) as FileRecord | undefined) ?? null;
  }

  create(record: Omit<FileRecord, 'archived_at'>): void {
    this.db.prepare(`INSERT INTO file (id, name, mime_type, size, storage_name, storage_provider, storage_bucket, storage_domain, created_at)
      VALUES (@id, @name, @mime_type, @size, @storage_name, @storage_provider, @storage_bucket, @storage_domain, @created_at)`).run(record);
  }

  archive(id: string): boolean {
    return this.db.prepare('UPDATE file SET archived_at = ? WHERE id = ? AND archived_at IS NULL')
      .run(new Date().toISOString(), id).changes > 0;
  }

  restore(id: string): boolean {
    return this.db.prepare('UPDATE file SET archived_at = NULL WHERE id = ? AND archived_at IS NOT NULL')
      .run(id).changes > 0;
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM file WHERE id = ?').run(id).changes > 0;
  }

  restoreDeleted(record: FileRecord): void {
    this.db.prepare(`INSERT INTO file (id, name, mime_type, size, storage_name, storage_provider, storage_bucket, storage_domain, created_at, archived_at)
      VALUES (@id, @name, @mime_type, @size, @storage_name, @storage_provider, @storage_bucket, @storage_domain, @created_at, @archived_at)`).run(record);
  }
}
