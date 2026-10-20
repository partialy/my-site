import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';

export class DatabaseBackupService {
  private readonly directory = path.resolve(__dirname, '../../data/backups');

  constructor(private readonly db: Database.Database) {}

  async create(): Promise<{ filePath: string; fileName: string }> {
    await mkdir(this.directory, { recursive: true });
    const fileName = `framework-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.sqlite.bak`;
    const filePath = path.join(this.directory, fileName);
    try {
      await this.db.backup(filePath);
      return { filePath, fileName };
    } catch (error) {
      await rm(filePath, { force: true });
      throw error;
    }
  }

  async remove(filePath: string): Promise<void> {
    await rm(filePath, { force: true });
  }
}
