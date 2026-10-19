import React from 'react';
import { AppWindow, Database, FileText, FolderOpen, KeyRound, LayoutDashboard, Menu, Settings2, SlidersHorizontal } from 'lucide-react';
import type { MenuItem } from '../api/menus';

export const MENU_ICON_OPTIONS = [
  { value: 'layout-dashboard', label: '首页' },
  { value: 'settings', label: '系统设置' },
  { value: 'appstore', label: '应用' },
  { value: 'setting', label: '设置' },
  { value: 'database', label: '数据库' },
  { value: 'file-text', label: '文档' },
  { value: 'folder', label: '文件夹' },
  { value: 'menu', label: '菜单' },
  { value: 'lock', label: '密码' },
];

export function renderMenuIcon(key: string | null): React.ReactNode {
  switch (key) {
    case 'layout-dashboard': return <LayoutDashboard size={18} />;
    case 'settings': return <Settings2 size={18} />;
    case 'appstore': return <AppWindow size={18} />;
    case 'setting': return <SlidersHorizontal size={18} />;
    case 'database': return <Database size={18} />;
    case 'file-text': return <FileText size={18} />;
    case 'folder': return <FolderOpen size={18} />;
    case 'menu': return <Menu size={18} />;
    case 'lock': return <KeyRound size={18} />;
    default: return null;
  }
}

export function sortedMenus(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));
}

export function getMenuPath(item: MenuItem): string | null {
  return item.type === 'route' ? item.path : null;
}
