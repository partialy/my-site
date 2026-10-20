import type Database from 'better-sqlite3';

/** 资源描述只能由服务端代码声明，不能从请求参数构造 SQL 标识符。 */
export interface TableListResource {
  table: string;
  columns: readonly string[];
  orderBy: string;
  order: 'ASC' | 'DESC';
  searchColumns?: readonly string[];
  equalityFilters?: Readonly<Record<string, string>>;
}

export interface TableListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface TableListPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quoteIdentifier(value: string): string {
  if (!identifier.test(value)) throw new Error(`无效的数据库资源字段：${value}`);
  return `"${value}"`;
}

/** 通用单表列表查询：字段和排序来自服务端静态配置，所有筛选值使用绑定参数。 */
export class TableListRepository {
  constructor(private readonly db: Database.Database) {}

  list<T, TQuery extends TableListQuery>(resource: TableListResource, query: TQuery): TableListPage<T> {
    const table = quoteIdentifier(resource.table);
    const columns = resource.columns.map(quoteIdentifier).join(', ');
    if (!columns) throw new Error('列表资源至少需要一个查询字段');
    const orderBy = quoteIdentifier(resource.orderBy);
    const conditions: string[] = [];
    const args: Array<string | number> = [];

    if (query.search && resource.searchColumns?.length) {
      const search = resource.searchColumns.map((column) => `instr(lower(${quoteIdentifier(column)}), lower(?)) > 0`);
      conditions.push(`(${search.join(' OR ')})`);
      args.push(...resource.searchColumns.map(() => query.search!));
    }
    for (const [key, column] of Object.entries(resource.equalityFilters ?? {})) {
      const value = (query as Record<string, unknown>)[key];
      if (value === undefined || value === null || value === '') continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new Error(`无效的筛选参数：${key}`);
      }
      conditions.push(`${quoteIdentifier(column)} = ?`);
      args.push(typeof value === 'boolean' ? Number(value) : value);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS total FROM ${table}${where}`).get(...args) as { total: number }).total;
    const items = this.db.prepare(`SELECT ${columns} FROM ${table}${where} ORDER BY ${orderBy} ${resource.order} LIMIT ? OFFSET ?`)
      .all(...args, query.pageSize, (query.page - 1) * query.pageSize) as T[];
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
