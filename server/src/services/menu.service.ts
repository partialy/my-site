import { z } from 'zod';
import { ApiCode } from '../api/codes';
import { ApiError } from '../api/api-error';
import { MenuRepository, type MenuRecord } from '../repositories/menu.repository';

const menuItemSchema = z.strictObject({
  key: z.string().trim().min(1).max(100).regex(/^[A-Za-z][A-Za-z0-9_-]*$/, '菜单键只能包含字母、数字、下划线和连字符'),
  label: z.string().trim().min(1).max(100),
  type: z.enum(['group', 'route', 'action']),
  parentKey: z.string().min(1).max(100).nullable(),
  path: z.string().min(1).max(500).nullable(),
  action: z.string().min(1).max(100).nullable(),
  icon: z.string().trim().max(100).nullable(),
  sort: z.number().int().min(0),
  visible: z.boolean(),
});

export const menuInputSchema = z.strictObject({ items: z.array(menuItemSchema).max(200) });
export type MenuInput = z.infer<typeof menuInputSchema>;

function invalid(message: string): never {
  throw new ApiError(400, ApiCode.ValidationError, message, { fieldErrors: { items: [message] } });
}

export function validateMenuStructure(items: MenuRecord[]): void {
  const byKey = new Map<string, MenuRecord>();
  const paths = new Set<string>();
  for (const item of items) {
    if (byKey.has(item.key)) invalid(`菜单键重复：${item.key}`);
    byKey.set(item.key, item);
    if (item.type === 'group') {
      if (item.parentKey !== null || item.path !== null || item.action !== null) invalid(`分组菜单 ${item.key} 必须是一级菜单，且不能设置路径或操作`);
    } else if (item.type === 'route') {
      if (item.action !== null || !item.path || !/^\/(?!\/)[^?#\\]*$/.test(item.path)) invalid(`路由菜单 ${item.key} 必须设置站内绝对路径，不能设置操作`);
      if (paths.has(item.path)) invalid(`路由路径重复：${item.path}`);
      paths.add(item.path);
    } else if (item.path !== null || item.action !== 'change-password') {
      invalid(`操作菜单 ${item.key} 只能使用 change-password 操作，不能设置路径`);
    }
  }
  for (const item of items) {
    if (item.parentKey === null) continue;
    const parent = byKey.get(item.parentKey);
    if (!parent || parent.type !== 'group' || parent.parentKey !== null) {
      invalid(`菜单 ${item.key} 的父级必须是一级分组菜单`);
    }
  }
}

export class MenuService {
  private items: MenuRecord[];

  constructor(private readonly repository: MenuRepository) {
    this.items = repository.list();
  }

  list(): MenuRecord[] {
    return this.items.map((item) => ({ ...item }));
  }

  reload(): void {
    this.items = this.repository.list();
  }

  replace(input: MenuInput): MenuRecord[] {
    validateMenuStructure(input.items);
    this.repository.replace(input.items);
    this.items = this.repository.list();
    return this.list();
  }
}
