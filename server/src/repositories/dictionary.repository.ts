import type Database from 'better-sqlite3';

export interface DictionaryItem {
  id: number;
  typeId: number;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface DictionaryType {
  id: number;
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
  id: number; code: string; name: string; remark: string; is_public: number;
  enabled: number; created_at: string; updated_at: string;
}

interface ItemRow {
  id: number; type_id: number; label: string; value: string; sort: number;
  enabled: number; color: string; created_at: string; updated_at: string;
}

function mapItem(row: ItemRow): DictionaryItem {
  return {
    id: row.id, typeId: row.type_id, label: row.label, value: row.value,
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
      id: row.id, code: row.code, name: row.name, remark: row.remark,
      isPublic: row.is_public === 1, enabled: row.enabled === 1,
      createdAt: row.created_at, updatedAt: row.updated_at,
      items: byType.get(row.id) ?? [],
    }));
  }

  createType(input: { code: string; name: string; remark: string; isPublic: boolean; enabled: boolean }): number {
    const now = new Date().toISOString();
    const result = this.db.prepare(`INSERT INTO dict_type
      (code, name, remark, is_public, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(input.code, input.name, input.remark, Number(input.isPublic), Number(input.enabled), now, now);
    return Number(result.lastInsertRowid);
  }

  createTypes(inputs: Array<{ code: string; name: string; remark: string; isPublic: boolean; enabled: boolean }>): number[] {
    return this.db.transaction(() => inputs.map((input) => this.createType(input)))();
  }

  updateType(id: number, input: { name: string; remark: string; isPublic: boolean; enabled: boolean }): boolean {
    const result = this.db.prepare(`UPDATE dict_type
      SET name = ?, remark = ?, is_public = ?, enabled = ?, updated_at = ? WHERE id = ?`)
      .run(input.name, input.remark, Number(input.isPublic), Number(input.enabled), new Date().toISOString(), id);
    return result.changes > 0;
  }

  createItem(typeId: number, input: { label: string; value: string; sort: number; enabled: boolean; color: string }): number {
    const now = new Date().toISOString();
    const result = this.db.prepare(`INSERT INTO dict_item
      (type_id, label, value, sort, enabled, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(typeId, input.label, input.value, input.sort, Number(input.enabled), input.color, now, now);
    return Number(result.lastInsertRowid);
  }

  createItems(typeId: number, inputs: Array<{ label: string; value: string; sort: number; enabled: boolean; color: string }>): number[] {
    return this.db.transaction(() => inputs.map((input) => this.createItem(typeId, input)))();
  }

  updateItem(typeId: number, itemId: number, input: { label: string; sort: number; enabled: boolean; color: string }): boolean {
    const result = this.db.prepare(`UPDATE dict_item SET label = ?, sort = ?, enabled = ?, color = ?, updated_at = ?
      WHERE id = ? AND type_id = ?`)
      .run(input.label, input.sort, Number(input.enabled), input.color, new Date().toISOString(), itemId, typeId);
    return result.changes > 0;
  }
}
