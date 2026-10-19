export interface TrendPoint {
  label: string;
  visits: number;
  users: number;
}

export interface WeeklyUserPoint {
  label: string;
  newUsers: number;
  activeUsers: number;
}

export interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

export interface PopularPage {
  path: string;
  label: string;
  visits: number;
  share: number;
}

function relativeDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const sevenDayVisits = [1180, 1370, 1260, 1630, 1510, 1820, 2148];
const sevenDayUsers = [740, 860, 805, 1020, 980, 1150, 1324];
const thirtyDayVisits = [920, 1080, 1010, 1260, 1190, 1410, 1340, 1660, 1810, 2148];
const thirtyDayUsers = [590, 690, 660, 810, 760, 910, 880, 1060, 1140, 1324];

export const trafficTrends: Record<'7d' | '30d', TrendPoint[]> = {
  '7d': sevenDayVisits.map((visits, index) => ({
    label: relativeDate(6 - index), visits, users: sevenDayUsers[index],
  })),
  '30d': thirtyDayVisits.map((visits, index) => ({
    label: relativeDate((9 - index) * 3), visits, users: thirtyDayUsers[index],
  })),
};

export const weeklyUsers: WeeklyUserPoint[] = [
  { label: '周一', newUsers: 28, activeUsers: 102 },
  { label: '周二', newUsers: 35, activeUsers: 118 },
  { label: '周三', newUsers: 32, activeUsers: 110 },
  { label: '周四', newUsers: 47, activeUsers: 137 },
  { label: '周五', newUsers: 41, activeUsers: 129 },
  { label: '周六', newUsers: 56, activeUsers: 156 },
  { label: '周日', newUsers: 63, activeUsers: 172 },
];

export const trafficSources: TrafficSource[] = [
  { name: '直接访问', value: 42, color: '#2463eb' },
  { name: '搜索引擎', value: 31, color: '#14b8a6' },
  { name: '社交媒体', value: 18, color: '#f59e0b' },
  { name: '其他来源', value: 9, color: '#cbd5e1' },
];

export const popularPages: PopularPage[] = [
  { path: '/', label: '首页', visits: 4218, share: 84 },
  { path: '/products', label: '产品列表', visits: 3186, share: 64 },
  { path: '/about', label: '关于我们', visits: 2045, share: 41 },
  { path: '/contact', label: '联系我们', visits: 1382, share: 28 },
];
