import type { TableListResource } from '../table-list.repository';
import type { FileSortBy, FileSortOrder } from '../file.repository';

const fileListResource: TableListResource = {
  table: 'file',
  columns: ['id', 'name', 'mime_type', 'size', 'storage_name', 'created_at', 'archived_at'],
  orderBy: 'created_at', order: 'DESC',
  orderColumns: [{ column: 'created_at', order: 'DESC' }, { column: 'id', order: 'DESC' }],
  nullColumns: ['archived_at'],
  containsFilters: { search: 'name' },
  arrayFilters: { mimeTypes: 'mime_type' },
};

/** 排序字段只能从静态映射读取，同值记录以 ID 保持稳定顺序。 */
export function fileListResourceForSort(sortBy: FileSortBy, sortOrder: FileSortOrder): TableListResource {
  const column = sortBy === 'size' ? 'size' : 'created_at';
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
  return { ...fileListResource,
    orderColumns: [{ column, order: direction }, { column: 'id', order: 'DESC' }] };
}
