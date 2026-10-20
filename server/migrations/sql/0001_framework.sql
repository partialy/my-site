CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  remark TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sys_config (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS file (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_file_active_created ON file(archived_at, created_at DESC);
CREATE TABLE IF NOT EXISTS menu (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('group', 'route', 'action')),
  parent_key TEXT,
  path TEXT,
  action TEXT,
  icon TEXT,
  sort INTEGER NOT NULL,
  visible INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS visit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_day TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  page_title TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(visitor_id, visit_day)
);
CREATE INDEX IF NOT EXISTS idx_visit_day ON visit(visit_day);
