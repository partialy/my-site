import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { runMigrations } from './migrate';

export function openDatabase(filePath: string, includeDevScripts = process.env.NODE_ENV !== 'production'): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath, { timeout: 5000 });
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db, includeDevScripts);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
