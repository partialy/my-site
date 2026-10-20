import type Database from 'better-sqlite3';

export interface AdminRecord {
  id: number;
  username: string;
  password_hash: string;
  token_version: number;
  created_at: string;
  updated_at: string;
}

export class AdminRepository {
  constructor(private readonly db: Database.Database) {}

  find(): AdminRecord | null {
    return (this.db.prepare('SELECT * FROM admin WHERE id = 1').get() as AdminRecord | undefined) ?? null;
  }

  updatePassword(passwordHash: string): void {
    this.db.prepare(
      'UPDATE admin SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = 1',
    ).run(passwordHash, new Date().toISOString());
  }
}
