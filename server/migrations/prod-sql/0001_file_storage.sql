ALTER TABLE file ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'local';
ALTER TABLE file ADD COLUMN storage_bucket TEXT;
ALTER TABLE file ADD COLUMN storage_domain TEXT;
