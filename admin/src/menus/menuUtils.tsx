import type { LucideIcon } from 'lucide-react';
import {
  Activity, AppWindow, BadgePercent, Banknote, BarChart3, Barcode, Bell,
  BookOpen, Boxes, Building2, CalendarCheck, CalendarDays, ChartPie,
  CheckCircle2, CircleUserRound, ClipboardCheck, ClipboardList, Clock3,
  Cloud, Code2, Cog, Coins, ContactRound, CreditCard, Database, Download,
  Eye, Factory, File, Files, FileSpreadsheet, FileText, Filter, FolderOpen,
  Gift, GitBranch, Globe, Grid2X2, HandCoins, HardDrive, Headset, Heart,
  House, IdCard, Image, Images, KeyRound, Layers3, LayoutDashboard, Link2,
  List, LockKeyhole, Mail, MapPin, Megaphone, Menu, MessageSquare, Music2,
  Package, PackageCheck, PackageOpen, Percent, Phone, QrCode, ReceiptText,
  ScanBarcode, Search, Server, Settings, Settings2, ShieldCheck, ShoppingBag,
  ShoppingBasket, ShoppingCart, SlidersHorizontal, Star, Store, Table2, Tag,
  Tags, Terminal, TicketPercent, TrendingDown, TrendingUp, Truck, Upload,
  UserCheck, UserCog, UserPlus, UserRound, UsersRound, UserX, Video, Wallet,
  WalletCards, Warehouse, Workflow, Wrench, Zap,
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
  cog: Cog, 'settings-gear': Settings, 'building-2': Building2,
  warehouse: Warehouse, factory: Factory, 'file-spreadsheet': FileSpreadsheet,
  'clipboard-check': ClipboardCheck, 'calendar-check': CalendarCheck,
  'user-circle': CircleUserRound, 'user-cog': UserCog, 'user-plus': UserPlus,
  'user-check': UserCheck, 'user-x': UserX, contact: ContactRound,
  'id-card': IdCard, headset: Headset,
  store: Store, 'shopping-bag': ShoppingBag, 'shopping-basket': ShoppingBasket,
  'package-check': PackageCheck, 'package-open': PackageOpen, truck: Truck,
  barcode: Barcode, 'scan-barcode': ScanBarcode, 'qr-code': QrCode,
  receipt: ReceiptText, 'badge-percent': BadgePercent, 'ticket-percent': TicketPercent,
  percent: Percent, gift: Gift, coins: Coins, banknote: Banknote,
  'hand-coins': HandCoins, 'wallet-cards': WalletCards,
  megaphone: Megaphone, 'trending-down': TrendingDown,
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
