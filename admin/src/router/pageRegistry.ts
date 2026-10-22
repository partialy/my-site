/**
 * 管理端页面清单。开发新页面时，同步在 routes.tsx 注册路由并在这里登记。
 * 此清单只供菜单编辑器选择页面，不控制侧栏显示；侧栏由数据库菜单配置决定。
 */
export interface PageRecord {
  path: string;
  name: string;
  defaultKey: string;
  defaultIcon: string | null;
  defaultMenu: boolean;
  menuSelectable: boolean;
}

export const PAGE_REGISTRY: readonly PageRecord[] = [
  { path: '/', name: '首页', defaultKey: 'home', defaultIcon: 'layout-dashboard', defaultMenu: true, menuSelectable: true },
  { path: '/system-config', name: '系统管理', defaultKey: 'system-config', defaultIcon: 'setting', defaultMenu: true, menuSelectable: true },
  { path: '/appearance', name: '外观设置', defaultKey: 'appearance', defaultIcon: 'palette', defaultMenu: false, menuSelectable: true },
  { path: '/configs', name: '配置管理', defaultKey: 'configs', defaultIcon: 'database', defaultMenu: true, menuSelectable: true },
  { path: '/dictionaries', name: '数据字典', defaultKey: 'dictionaries', defaultIcon: 'book', defaultMenu: false, menuSelectable: true },
  { path: '/request-logs', name: '请求日志', defaultKey: 'request-logs', defaultIcon: 'file-text', defaultMenu: true, menuSelectable: true },
  { path: '/operation-logs', name: '操作日志', defaultKey: 'operation-logs', defaultIcon: 'history', defaultMenu: false, menuSelectable: true },
  { path: '/visit-logs', name: '访问日志', defaultKey: 'visit-logs', defaultIcon: 'bar-chart', defaultMenu: false, menuSelectable: true },
  { path: '/users', name: '用户管理', defaultKey: 'users', defaultIcon: 'users', defaultMenu: false, menuSelectable: true },
  { path: '/files', name: '文件管理', defaultKey: 'files', defaultIcon: 'folder', defaultMenu: true, menuSelectable: true },
  { path: '/upload-settings', name: '上传设置', defaultKey: 'upload-settings', defaultIcon: 'cloud', defaultMenu: false, menuSelectable: true },
  { path: '/menus', name: '菜单管理', defaultKey: 'menu-management', defaultIcon: 'menu', defaultMenu: true, menuSelectable: true },
  { path: '/api-docs', name: '接口文档', defaultKey: 'api-docs', defaultIcon: 'book', defaultMenu: false, menuSelectable: true },
  { path: '/login', name: '登录', defaultKey: 'login', defaultIcon: null, defaultMenu: false, menuSelectable: false },
  { path: '/setup', name: '初始化管理员', defaultKey: 'setup', defaultIcon: null, defaultMenu: false, menuSelectable: false },
  { path: '/404', name: '页面不存在', defaultKey: 'not-found', defaultIcon: null, defaultMenu: false, menuSelectable: false },
];
