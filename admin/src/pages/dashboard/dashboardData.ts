export interface WeeklyUserPoint {
  label: string;
  newUsers: number;
  activeUsers: number;
}

// 通用脚手架没有业务用户表，此图仅展示未来可接入的数据形态。
export const weeklyUsers: WeeklyUserPoint[] = [
  { label: '周一', newUsers: 28, activeUsers: 102 },
  { label: '周二', newUsers: 35, activeUsers: 118 },
  { label: '周三', newUsers: 32, activeUsers: 110 },
  { label: '周四', newUsers: 47, activeUsers: 137 },
  { label: '周五', newUsers: 41, activeUsers: 129 },
  { label: '周六', newUsers: 56, activeUsers: 156 },
  { label: '周日', newUsers: 63, activeUsers: 172 },
];
