-- 旧库保留整数主键和外键，新增对外 UUID；SQLite 的 ADD COLUMN 不能直接添加唯一约束。
ALTER TABLE dict_type ADD COLUMN uuid TEXT;
UPDATE dict_type SET uuid = lower(hex(randomblob(6))) || '4' || substr(lower(hex(randomblob(2))), 2, 3) ||
  substr('89ab', (random() & 3) + 1, 1) || substr(lower(hex(randomblob(2))), 2, 3) ||
  lower(hex(randomblob(6))) WHERE uuid IS NULL;
CREATE UNIQUE INDEX idx_dict_type_uuid ON dict_type(uuid);

ALTER TABLE dict_item ADD COLUMN uuid TEXT;
UPDATE dict_item SET uuid = lower(hex(randomblob(6))) || '4' || substr(lower(hex(randomblob(2))), 2, 3) ||
  substr('89ab', (random() & 3) + 1, 1) || substr(lower(hex(randomblob(2))), 2, 3) ||
  lower(hex(randomblob(6))) WHERE uuid IS NULL;
CREATE UNIQUE INDEX idx_dict_item_uuid ON dict_item(uuid);

CREATE TRIGGER dict_type_uuid_required_insert BEFORE INSERT ON dict_type WHEN NEW.uuid IS NULL
BEGIN SELECT RAISE(ABORT, 'dict_type.uuid required'); END;
CREATE TRIGGER dict_item_uuid_required_insert BEFORE INSERT ON dict_item WHEN NEW.uuid IS NULL
BEGIN SELECT RAISE(ABORT, 'dict_item.uuid required'); END;
