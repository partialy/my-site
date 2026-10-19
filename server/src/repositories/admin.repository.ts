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

  createInitial(username: string, passwordHash: string): AdminRecord | null {
    const create = this.db.transaction(() => {
      if (this.find()) return null;
      const now = new Date().toISOString();
      this.db.prepare(
        'INSERT INTO admin (id, username, password_hash, token_version, created_at, updated_at) VALUES (1, ?, ?, 0, ?, ?)',
      ).run(username, passwordHash, now, now);
      return this.find();
    });
    return create.immediate();
  }

  updatePassword(passwordHash: string): void {
    this.db.prepare(
      'UPDATE admin SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = 1',
    ).run(passwordHash, new Date().toISOString());
  }
}
