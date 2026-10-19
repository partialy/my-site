interface IconCategory {
  title: string;
  keys: readonly string[];
}

const categories: readonly IconCategory[] = [
  { title: '基础与导航', keys: [
    'layout-dashboard', 'appstore', 'house', 'menu', 'grid', 'layers', 'list', 'table',
    'search', 'filter', 'link', 'globe', 'map', 'map-pin', 'route', 'eye',
  ] },
  { title: '系统与设置', keys: [
    'settings', 'setting', 'cog', 'settings-gear', 'database', 'server', 'cloud',
    'hard-drive', 'monitor', 'smartphone', 'cpu', 'terminal', 'code', 'network',
    'workflow', 'git-branch', 'git-pull-request', 'printer', 'wrench',
  ] },
  { title: '用户与安全', keys: [
    'user', 'users', 'user-circle', 'user-cog', 'user-plus', 'user-check', 'user-x',
    'contact', 'id-card', 'key', 'lock', 'lock-keyhole', 'shield-check',
    'shield-alert', 'fingerprint',
  ] },
  { title: '购物与交易', keys: [
    'store', 'shopping-cart', 'shopping-bag', 'shopping-basket', 'package',
    'package-check', 'package-open', 'boxes', 'truck', 'warehouse', 'factory',
    'barcode', 'scan-barcode', 'qr-code', 'receipt', 'credit-card', 'wallet',
    'wallet-cards', 'coins', 'banknote', 'hand-coins', 'badge-percent',
    'ticket-percent', 'percent', 'ticket', 'gift',
  ] },
  { title: '内容与文件', keys: [
    'folder', 'file', 'files', 'file-text', 'file-spreadsheet', 'image', 'images',
    'video', 'music', 'book', 'upload', 'download', 'tag', 'tags',
  ] },
  { title: '业务与效率', keys: [
    'briefcase', 'clipboard-list', 'clipboard-check', 'list-todo', 'check-square',
    'calendar', 'calendar-check', 'clock', 'timer', 'hourglass', 'history',
    'mail', 'message', 'phone', 'send', 'megaphone', 'headset', 'life-buoy',
  ] },
  { title: '数据与状态', keys: [
    'bar-chart', 'pie-chart', 'activity', 'trending-up', 'trending-down',
    'check-circle', 'triangle-alert', 'circle-help', 'bell', 'star', 'heart',
    'heart-pulse', 'flame', 'trophy', 'award', 'sparkles', 'bot',
    'graduation-cap', 'radio', 'zap',
  ] },
];

/** 分类只决定选择器排布；新增的图标键即使未分类也会自动显示在“其他”。 */
export function getMenuIconCategories(iconKeys: readonly string[]): IconCategory[] {
  const available = new Set(iconKeys);
  const used = new Set<string>();
  const groups = categories.map(({ title, keys }) => ({
    title,
    keys: keys.filter((key) => {
      if (!available.has(key) || used.has(key)) return false;
      used.add(key);
      return true;
    }),
  })).filter((group) => group.keys.length > 0);
  const others = iconKeys.filter((key) => !used.has(key));
  if (others.length) groups.push({ title: '其他', keys: others });
  return groups;
}
