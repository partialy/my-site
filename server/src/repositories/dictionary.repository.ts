import type Database from 'better-sqlite3';

export interface DictionaryItem {
  uuid: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface DictionaryType {
  uuid: string;
  code: string;
  name: string;
  remark: string;
  isPublic: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  items: DictionaryItem[];
}

interface TypeRow {
  id: number; uuid: string; code: string; name: string; remark: string; is_public: number;
  enabled: number; created_at: string; updated_at: string;
}

interface ItemRow {
  id: number; uuid: string; type_id: number; label: string; value: string; sort: number;
  enabled: number; color: string; created_at: string; updated_at: string;
}

function mapItem(row: ItemRow): DictionaryItem {
  return {
    uuid: row.uuid, label: row.label, value: row.value,
    sort: row.sort, enabled: row.enabled === 1, color: row.color,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export class DictionaryRepository {
  constructor(private readonly db: Database.Database) {}

  list(): DictionaryType[] {
    const types = this.db.prepare('SELECT * FROM dict_type ORDER BY id').all() as TypeRow[];
    const items = this.db.prepare('SELECT * FROM dict_item ORDER BY type_id, sort, id').all() as ItemRow[];
    const byType = new Map<number, DictionaryItem[]>();
    for (const row of items) {
      const group = byType.get(row.type_id) ?? [];
      group.push(mapItem(row));
      byType.set(row.type_id, group);
    }
    return types.map((row) => ({
      uuid: row.uuid, code: row.code, name: row.name, remark: row.remark,
      isPublic: row.is_public === 1, enabled: row.enabled === 1,
      createdAt: row.created_at, updatedAt: row.updated_at,
      items: byType.get(row.id) ?? [],
    }));
  }

  createType(input: { uuid: string; code: string; name: string; remark: string; isPublic: boolean; enabled: boolean }): void {
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO dict_type
      (uuid, code, name, remark, is_public, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.uuid, input.code, input.name, input.remark, Number(input.isPublic), Number(input.enabled), now, now);
  }

  createTypes(inputs: Array<{ uuid: string; code: string; name: string; remark: string; isPublic: boolean; enabled: boolean }>): void {
    this.db.transaction(() => inputs.forEach((input) => this.createType(input)))();
  }

  updateType(uuid: string, input: { name: string; remark: string; isPublic: boolean; enabled: boolean }): boolean {
    const result = this.db.prepare(`UPDATE dict_type
      SET name = ?, remark = ?, is_public = ?, enabled = ?, updated_at = ? WHERE uuid = ?`)
      .run(input.name, input.remark, Number(input.isPublic), Number(input.enabled), new Date().toISOString(), uuid);
    return result.changes > 0;
  }

  private getTypeId(uuid: string): number {
    const row = this.db.prepare('SELECT id FROM dict_type WHERE uuid = ?').get(uuid) as { id: number } | undefined;
    if (!row) throw new Error('字典类型不存在');
    return row.id;
  }

  private insertItem(typeId: number, input: { uuid: string; label: string; value: string; sort: number; enabled: boolean; color: string }): void {
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO dict_item
      (uuid, type_id, label, value, sort, enabled, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.uuid, typeId, input.label, input.value, input.sort, Number(input.enabled), input.color, now, now);
  }

  createItem(typeUuid: string, input: { uuid: string; label: string; value: string; sort: number; enabled: boolean; color: string }): void {
    this.insertItem(this.getTypeId(typeUuid), input);
  }

  createItems(typeUuid: string, inputs: Array<{ uuid: string; label: string; value: string; sort: number; enabled: boolean; color: string }>): void {
    this.db.transaction(() => {
      const typeId = this.getTypeId(typeUuid);
      inputs.forEach((input) => this.insertItem(typeId, input));
    })();
  }

  updateItem(typeUuid: string, itemUuid: string, input: { label: string; sort: number; enabled: boolean; color: string }): boolean {
    const result = this.db.prepare(`UPDATE dict_item SET label = ?, sort = ?, enabled = ?, color = ?, updated_at = ?
      WHERE uuid = ? AND type_id = (SELECT id FROM dict_type WHERE uuid = ?)`)
      .run(input.label, input.sort, Number(input.enabled), input.color, new Date().toISOString(), itemUuid, typeUuid);
    return result.changes > 0;
  }
}
