import { request } from './client';

export type MenuType = 'group' | 'route' | 'action';

export interface MenuItem {
  key: string;
  label: string;
  type: MenuType;
  parentKey: string | null;
  path: string | null;
  action: string | null;
  icon: string | null;
  sort: number;
  visible: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMenuItem(value: unknown): MenuItem {
  if (!isRecord(value) || typeof value.key !== 'string' || typeof value.label !== 'string' ||
      (value.type !== 'group' && value.type !== 'route' && value.type !== 'action') ||
      (value.parentKey !== null && typeof value.parentKey !== 'string') ||
      (value.path !== null && typeof value.path !== 'string') ||
      (value.action !== null && typeof value.action !== 'string') ||
      (value.icon !== null && typeof value.icon !== 'string') ||
      typeof value.sort !== 'number' || typeof value.visible !== 'boolean') {
    throw new Error('菜单数据格式异常');
  }
  return {
    key: value.key,
    label: value.label,
    type: value.type,
    parentKey: value.parentKey,
    path: value.path,
    action: value.action,
    icon: value.icon,
    sort: value.sort,
    visible: value.visible,
  };
}

function parseMenuItems(value: unknown): MenuItem[] {
  if (!Array.isArray(value)) throw new Error('菜单列表格式异常');
  return value.map(parseMenuItem);
}

export function getMenus() {
  return request('menus', parseMenuItems);
}

export function saveMenus(items: MenuItem[]) {
  return request('menus', parseMenuItems, { method: 'PUT', body: { items } });
}
