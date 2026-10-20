CREATE TABLE operation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  summary TEXT NOT NULL,
  changed_fields TEXT NOT NULL DEFAULT '[]',
  ip TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_operation_log_created ON operation_log(created_at DESC);
CREATE INDEX idx_operation_log_module_created ON operation_log(module, created_at DESC);
CREATE INDEX idx_operation_log_actor_created ON operation_log(actor_name, created_at DESC);
