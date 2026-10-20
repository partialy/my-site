CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_user_created ON user(created_at);
CREATE INDEX idx_user_status_created ON user(status, created_at DESC);
CREATE TABLE user_activity (
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  activity_day TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, activity_day)
);
CREATE INDEX idx_user_activity_day ON user_activity(activity_day);
