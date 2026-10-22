import type { TableListResource } from '../table-list.repository';

/** 用户列表只暴露管理端需要的字段，不读取密码哈希。 */
export const userListResource: TableListResource = {
  table: 'user',
  columns: ['id', 'uuid', 'account', 'nickname', 'avatar', 'status', 'created_at', 'updated_at'],
  orderBy: 'id',
  order: 'DESC',
  searchColumns: ['account', 'nickname'],
  equalityFilters: { status: 'status' },
};
