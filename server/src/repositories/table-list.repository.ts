import type Database from 'better-sqlite3';
import { createPageResult, type PageResult, type PaginationQuery } from '../shared/pagination';

/** 资源描述只能由服务端代码声明，不能从请求参数构造 SQL 标识符。 */
export interface TableListResource {
  table: string;
  columns: readonly string[];
  orderBy: string;
  order: 'ASC' | 'DESC';
  searchColumns?: readonly string[];
  equalityFilters?: Readonly<Record<string, string>>;
  containsFilters?: Readonly<Record<string, string>>;
  rangeFilters?: Readonly<Record<string, { column: string; operator: '>=' | '<=' | '>' | '<' }>>;
  arrayFilters?: Readonly<Record<string, string>>;
  nullColumns?: readonly string[];
  notNullColumns?: readonly string[];
  orderColumns?: ReadonlyArray<{ column: string; order: 'ASC' | 'DESC' }>;
}

export interface TableListQuery extends PaginationQuery {
  search?: string;
}

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quoteIdentifier(value: string): string {
  if (!identifier.test(value)) throw new Error(`无效的数据库资源字段：${value}`);
  return `"${value}"`;
}

function filterValue(query: object, key: string): unknown {
  return (query as Record<string, unknown>)[key];
}

function scalar(value: unknown, key: string): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return Number(value);
  throw new Error(`无效的筛选参数：${key}`);
}

function escapeLike(value: string): string {
  return `%${value.replace(/[!%_]/g, '!$&')}%`;
}

/** 通用单表列表查询：字段和排序来自服务端静态配置，所有筛选值使用绑定参数。 */
export class TableListRepository {
  constructor(private readonly db: Database.Database) {}

  list<T, TQuery extends TableListQuery>(resource: TableListResource, query: TQuery): PageResult<T> {
    const table = quoteIdentifier(resource.table);
    const columns = resource.columns.map(quoteIdentifier).join(', ');
    if (!columns) throw new Error('列表资源至少需要一个查询字段');
    const orderBy = resource.orderColumns?.length
      ? resource.orderColumns.map((item) => `${quoteIdentifier(item.column)} ${item.order}`).join(', ')
      : `${quoteIdentifier(resource.orderBy)} ${resource.order}`;
    const conditions: string[] = [];
    const args: Array<string | number> = [];

    for (const column of resource.nullColumns ?? []) conditions.push(`${quoteIdentifier(column)} IS NULL`);
    for (const column of resource.notNullColumns ?? []) conditions.push(`${quoteIdentifier(column)} IS NOT NULL`);

    if (query.search && resource.searchColumns?.length) {
      const search = resource.searchColumns.map((column) => `instr(lower(${quoteIdentifier(column)}), lower(?)) > 0`);
      conditions.push(`(${search.join(' OR ')})`);
      args.push(...resource.searchColumns.map(() => query.search!));
    }
    for (const [key, column] of Object.entries(resource.equalityFilters ?? {})) {
      const value = filterValue(query, key);
      if (value === undefined || value === null || value === '') continue;
      conditions.push(`${quoteIdentifier(column)} = ?`);
      args.push(scalar(value, key));
    }
    for (const [key, column] of Object.entries(resource.containsFilters ?? {})) {
      const value = filterValue(query, key);
      if (value === undefined || value === null || value === '') continue;
      if (typeof value !== 'string') throw new Error(`无效的筛选参数：${key}`);
      conditions.push(`${quoteIdentifier(column)} LIKE ? ESCAPE '!'`);
      args.push(escapeLike(value));
    }
    for (const [key, rule] of Object.entries(resource.rangeFilters ?? {})) {
      const value = filterValue(query, key);
      if (value === undefined || value === null || value === '') continue;
      conditions.push(`${quoteIdentifier(rule.column)} ${rule.operator} ?`);
      args.push(scalar(value, key));
    }
    for (const [key, column] of Object.entries(resource.arrayFilters ?? {})) {
      const value = filterValue(query, key);
      if (value === undefined || value === null) continue;
      if (!Array.isArray(value)) throw new Error(`无效的筛选参数：${key}`);
      if (!value.length) { conditions.push('1 = 0'); continue; }
      conditions.push(`${quoteIdentifier(column)} IN (${value.map(() => '?').join(', ')})`);
      args.push(...value.map((item) => scalar(item, key)));
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) AS total FROM ${table}${where}`).get(...args) as { total: number }).total;
    const list = this.db.prepare(`SELECT ${columns} FROM ${table}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...args, query.limit, query.offset) as T[];
    return createPageResult(list, total, query);
  }
}
