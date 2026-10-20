import type { TableListResource } from '../table-list.repository';

export const fileListResource: TableListResource = {
  table: 'file',
  columns: ['id', 'name', 'mime_type', 'size', 'storage_name', 'created_at', 'archived_at'],
  orderBy: 'created_at', order: 'DESC',
  orderColumns: [{ column: 'created_at', order: 'DESC' }, { column: 'id', order: 'DESC' }],
  nullColumns: ['archived_at'],
  containsFilters: { search: 'name' },
  arrayFilters: { mimeTypes: 'mime_type' },
};
