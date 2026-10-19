import type { LucideIcon } from 'lucide-react';
import {
  Activity, AppWindow, BarChart3, Bell, BookOpen, Boxes, CalendarDays, ChartPie,
  CheckCircle2, ClipboardList, Clock3, Cloud, Code2, CreditCard, Database,
  Download, Eye, File, Files, FileText, Filter, FolderOpen, GitBranch, Globe,
  Grid2X2, HardDrive, Heart, House, Image, Images, KeyRound, Layers3,
  LayoutDashboard, Link2, List, LockKeyhole, Mail, MapPin, Menu, MessageSquare,
  Music2, Package, Phone, Search, Server, Settings2, ShieldCheck, ShoppingCart,
  SlidersHorizontal, Star, Table2, Tag, Tags, Terminal, TrendingUp, Upload,
  UserRound, UsersRound, Video, Wallet, Workflow, Wrench, Zap,
} from 'lucide-react';
import type { MenuItem } from '../api/menus';

const menuIcons: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard, settings: Settings2, appstore: AppWindow,
  setting: SlidersHorizontal, database: Database, 'file-text': FileText,
  folder: FolderOpen, menu: Menu, lock: KeyRound,
  house: House, user: UserRound, users: UsersRound, 'shield-check': ShieldCheck,
  bell: Bell, mail: Mail, calendar: CalendarDays, clock: Clock3, search: Search,
  filter: Filter, 'bar-chart': BarChart3, 'pie-chart': ChartPie, activity: Activity,
  'trending-up': TrendingUp, 'shopping-cart': ShoppingCart, package: Package,
  boxes: Boxes, 'clipboard-list': ClipboardList, list: List, table: Table2,
  grid: Grid2X2, layers: Layers3, tag: Tag, tags: Tags, image: Image,
  images: Images, video: Video, music: Music2, file: File, files: Files,
  download: Download, upload: Upload, cloud: Cloud, 'hard-drive': HardDrive,
  server: Server, globe: Globe, link: Link2, wrench: Wrench, workflow: Workflow,
  'git-branch': GitBranch, code: Code2, terminal: Terminal, book: BookOpen,
  message: MessageSquare, phone: Phone, 'map-pin': MapPin,
  'lock-keyhole': LockKeyhole, eye: Eye, star: Star, heart: Heart, zap: Zap,
  'credit-card': CreditCard, wallet: Wallet, 'check-circle': CheckCircle2,
};

export const MENU_ICON_OPTIONS = Object.keys(menuIcons);

export function renderMenuIcon(key: string | null, size = 18) {
  const Icon = key ? menuIcons[key] : null;
  return Icon ? <Icon size={size} /> : null;
}

export function sortedMenus(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));
}

export function getMenuPath(item: MenuItem): string | null {
  return item.type === 'route' ? item.path : null;
}
