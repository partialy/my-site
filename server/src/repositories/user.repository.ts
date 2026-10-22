import type Database from 'better-sqlite3';
import { TableListRepository } from './table-list.repository';
import { userListResource } from './resources/user-list.resource';

export type UserStatus = 'active' | 'disabled';

export interface UserRecord {
  id: number;
  account: string;
  password_hash: string;
  nickname: string;
  avatar: string | null;
  status: UserStatus;
  token_version: number;
  created_at: string;
  updated_at: string;
}

export type UserListRecord = Omit<UserRecord, 'password_hash' | 'token_version'>;

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
}

export interface UserListPage {
  items: UserListRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export class UserRepository {
  private readonly tableList: TableListRepository;

  constructor(private readonly db: Database.Database) {
    this.tableList = new TableListRepository(db);
  }

  findById(id: number): UserRecord | null {
    return (this.db.prepare('SELECT * FROM user WHERE id = ?').get(id) as UserRecord | undefined) ?? null;
  }

  findByAccount(account: string): UserRecord | null {
    return (this.db.prepare('SELECT * FROM user WHERE account = ? COLLATE NOCASE').get(account) as UserRecord | undefined) ?? null;
  }

  create(account: string, passwordHash: string, nickname: string): UserRecord {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO user (account, password_hash, nickname, avatar, status, token_version, created_at, updated_at)
      VALUES (?, ?, ?, NULL, 'active', 0, ?, ?)
    `).run(account, passwordHash, nickname, now, now);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  updateStatus(id: number, status: UserStatus): UserRecord | null {
    const result = this.db.prepare(`
      UPDATE user SET status = ?, token_version = token_version + 1, updated_at = ? WHERE id = ? AND status <> ?
    `).run(status, new Date().toISOString(), id, status);
    if (result.changes === 0) return this.findById(id);
    return this.findById(id);
  }

  updateProfile(id: number, nickname: string, avatar: string | null): UserRecord | null {
    this.db.prepare('UPDATE user SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?')
      .run(nickname, avatar, new Date().toISOString(), id);
    return this.findById(id);
  }

  list(query: UserListQuery): UserListPage {
    return this.tableList.list<UserListRecord, UserListQuery>(userListResource, query);
  }

  recordActivity(userId: number, day: string, time: string): void {
    this.db.prepare('INSERT OR IGNORE INTO user_activity (user_id, activity_day, created_at) VALUES (?, ?, ?)')
      .run(userId, day, time);
  }

  dashboard(startDay: string): {
    total: number;
    activeLast7Days: number;
    newLast7Days: number;
    newUsersByDay: Array<{ day: string; count: number }>;
    activeUsersByDay: Array<{ day: string; count: number }>;
  } {
    const startTime = `${startDay}T00:00:00.000Z`;
    const total = (this.db.prepare('SELECT COUNT(*) AS count FROM user').get() as { count: number }).count;
    const newLast7Days = (this.db.prepare('SELECT COUNT(*) AS count FROM user WHERE created_at >= ?').get(startTime) as { count: number }).count;
    const activeLast7Days = (this.db.prepare('SELECT COUNT(DISTINCT user_id) AS count FROM user_activity WHERE activity_day >= ?').get(startDay) as { count: number }).count;
    const newUsersByDay = this.db.prepare(`SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
      FROM user WHERE created_at >= ? GROUP BY day`).all(startTime) as Array<{ day: string; count: number }>;
    const activeUsersByDay = this.db.prepare(`SELECT activity_day AS day, COUNT(*) AS count
      FROM user_activity WHERE activity_day >= ? GROUP BY activity_day`).all(startDay) as Array<{ day: string; count: number }>;
    return { total, activeLast7Days, newLast7Days, newUsersByDay, activeUsersByDay };
  }
}
