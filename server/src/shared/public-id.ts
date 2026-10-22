import { randomUUID } from 'node:crypto';
import { z } from 'zod';

/** 对外资源标识：UUID v4 去掉连字符，数据库整数主键只用于内部关联。 */
export const publicIdSchema = z.string().regex(/^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/);

export function createPublicId(): string {
  return randomUUID().replaceAll('-', '');
}
