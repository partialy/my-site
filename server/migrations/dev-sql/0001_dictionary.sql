CREATE TABLE dict_type (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  remark TEXT NOT NULL DEFAULT '',
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE dict_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id INTEGER NOT NULL REFERENCES dict_type(id),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  color TEXT NOT NULL DEFAULT 'default' CHECK (color IN ('default', 'blue', 'green', 'orange', 'red', 'purple', 'cyan', 'gold')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (type_id, value)
);
CREATE INDEX idx_dict_item_type_sort ON dict_item(type_id, sort, id);
