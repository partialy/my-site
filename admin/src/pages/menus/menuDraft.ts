import type { MenuItem } from '../../api/menus';
import { sortedMenus } from '../../menus/menuUtils';

export function normalizeMenuOrder(items: MenuItem[]): MenuItem[] {
  const byParent = new Map<string | null, MenuItem[]>();
  for (const item of items) {
    const siblings = byParent.get(item.parentKey) ?? [];
    siblings.push(item);
    byParent.set(item.parentKey, siblings);
  }
  return [...byParent.entries()].flatMap(([, siblings]) =>
    sortedMenus(siblings).map((item, index) => ({ ...item, sort: index + 1 })));
}

export function moveMenu(items: MenuItem[], key: string, direction: -1 | 1): MenuItem[] {
  const current = items.find((item) => item.key === key);
  if (!current) return items;
  const siblings = sortedMenus(items.filter((item) => item.parentKey === current.parentKey));
  const index = siblings.findIndex((item) => item.key === key);
  const target = index + direction;
  if (target < 0 || target >= siblings.length) return items;
  [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
  const order = new Map(siblings.map((item, position) => [item.key, position + 1]));
  return items.map((item) => order.has(item.key) ? { ...item, sort: order.get(item.key)! } : item);
}

export function validateMenuDraft(items: MenuItem[]): string | null {
  const keys = new Set<string>();
  const paths = new Set<string>();
  for (const item of items) {
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.key)) return `菜单「${item.label}」的标识只能包含字母、数字、下划线和连字符`;
    if (keys.has(item.key)) return `菜单标识「${item.key}」重复`;
    keys.add(item.key);
    if (!item.label.trim()) return `菜单「${item.key}」缺少名称`;
    if (item.type === 'group') {
      if (item.parentKey || item.path || item.action) return `分组「${item.label}」只能作为一级菜单`;
    } else {
      if (item.parentKey && !items.some((parent) => parent.key === item.parentKey && parent.type === 'group')) {
        return `菜单「${item.label}」的父级必须是分组`;
      }
      if (item.type === 'route') {
        if (!item.path || !/^\/(?!\/)[^?#\\]*$/.test(item.path)) return `路由菜单「${item.label}」需要站内绝对路径，且不能包含查询参数或锚点`;
        if (paths.has(item.path)) return `路由路径「${item.path}」重复`;
        paths.add(item.path);
        if (item.action) return `路由菜单「${item.label}」不能设置动作`;
      } else if (item.action !== 'change-password' || item.path) {
        return `操作菜单「${item.label}」只能使用修改密码操作，且不能设置路径`;
      }
    }
  }
  return null;
}
