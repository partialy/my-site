import { daysAgo } from './visit.service';

export interface UserTrendPoint {
  day: string;
  newUsers: number;
  activeUsers: number;
}

export interface UserDashboardData {
  source: 'mock';
  total: number;
  activeLast7Days: number;
  newLast7Days: number;
  trend7: UserTrendPoint[];
}

// 脚手架尚无业务用户表，业务项目接入用户模块后替换此数据源。
const userTrendValues = [
  { newUsers: 28, activeUsers: 102 },
  { newUsers: 35, activeUsers: 118 },
  { newUsers: 32, activeUsers: 110 },
  { newUsers: 47, activeUsers: 137 },
  { newUsers: 41, activeUsers: 129 },
  { newUsers: 56, activeUsers: 156 },
  { newUsers: 63, activeUsers: 172 },
];

export function getDemoUserDashboard(now: Date): UserDashboardData {
  const trend7 = userTrendValues.map((point, index) => ({
    day: daysAgo(now, 6 - index), ...point,
  }));
  return {
    source: 'mock', total: 2680, activeLast7Days: 468,
    newLast7Days: trend7.reduce((total, point) => total + point.newUsers, 0), trend7,
  };
}
