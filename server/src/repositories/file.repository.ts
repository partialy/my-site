import type Database from 'better-sqlite3';
import { TableListRepository } from './table-list.repository';
import { fileListResourceForSort } from './resources/file-list.resource';

export type FileSortBy = 'createdAt' | 'size';
export type FileSortOrder = 'asc' | 'desc';

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
  sortBy?: FileSortBy;
  sortOrder?: FileSortOrder;
}

export class FileRepository {
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

  list(query: FileListQuery): { items: FileRecord[]; total: number } {
    return this.tableList.list<FileRecord, FileListQuery>(
      fileListResourceForSort(query.sortBy ?? 'createdAt', query.sortOrder ?? 'desc'), query,
    );
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
