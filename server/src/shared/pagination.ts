import { z } from 'zod';

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;

/** 所有分页接口共用的 offset / limit 校验字段。 */
export const paginationQueryShape = {
  offset: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  limit: z.coerce.number().int().min(1).max(MAX_PAGINATION_LIMIT).default(DEFAULT_PAGINATION_LIMIT),
};

export interface PaginationQuery {
  offset: number;
  limit: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/** 构造统一分页结果，hasMore 表示当前切片之后是否仍有剩余数据。 */
export function createPageResult<T>(list: T[], total: number, query: PaginationQuery): PageResult<T> {
  return {
    list,
    total,
    offset: query.offset,
    limit: query.limit,
    hasMore: query.offset + list.length < total,
  };
}

/** 保持分页元信息不变，将列表项映射为输出 DTO。 */
export function mapPageResult<TSource, TTarget>(
  page: PageResult<TSource>,
  mapper: (item: TSource) => TTarget,
): PageResult<TTarget> {
  return {
    list: page.list.map(mapper),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}
