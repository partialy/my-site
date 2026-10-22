-- 已执行的 0002 保持原样，后续约束由新升级脚本补充。
CREATE TRIGGER user_uuid_required_update BEFORE UPDATE OF uuid ON user WHEN NEW.uuid IS NULL
BEGIN SELECT RAISE(ABORT, 'user.uuid required'); END;
CREATE TRIGGER dict_type_uuid_required_update BEFORE UPDATE OF uuid ON dict_type WHEN NEW.uuid IS NULL
BEGIN SELECT RAISE(ABORT, 'dict_type.uuid required'); END;
CREATE TRIGGER dict_item_uuid_required_update BEFORE UPDATE OF uuid ON dict_item WHEN NEW.uuid IS NULL
BEGIN SELECT RAISE(ABORT, 'dict_item.uuid required'); END;
