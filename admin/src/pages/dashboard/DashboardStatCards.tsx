import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Eye, UserRound, UsersRound } from 'lucide-react';
import type { DashboardData } from '../../api/dashboard';

interface StatCardData {
  label: string;
  value: string;
  change?: string;
  note: string;
  icon: ReactNode;
  tone: string;
}

export function DashboardStatCards({ data }: { data: DashboardData }) {
  const { visits, users } = data;
  const change = visits.yesterday > 0
    ? `${visits.today >= visits.yesterday ? '+' : ''}${Math.round((visits.today - visits.yesterday) / visits.yesterday * 1000) / 10}%`
    : undefined;
  const stats: StatCardData[] = [
    { label: '今日访问量', value: visits.today.toLocaleString('zh-CN'), change,
      note: change ? '较昨日' : '按访客 ID 去重', icon: <Eye size={19} />, tone: 'blue' },
    { label: '近 7 日访问量', value: visits.last7Days.toLocaleString('zh-CN'),
      note: '每日去重记录之和', icon: <CalendarDays size={19} />, tone: 'teal' },
    { label: '近 7 日活跃用户', value: users.activeLast7Days.toLocaleString('zh-CN'),
      note: '按用户去重',
      icon: <UsersRound size={19} />, tone: 'orange' },
    { label: '用户总数', value: users.total.toLocaleString('zh-CN'),
      note: '业务用户账号数',
      icon: <UserRound size={19} />, tone: 'slate' },
  ];

  return <section className="dashboard-stats" aria-label="关键指标">
    {stats.map((stat) => <article className={`dashboard-stat dashboard-stat-${stat.tone}`} key={stat.label}>
      <div className="dashboard-stat-top">
        <span className="dashboard-stat-label">{stat.label}</span>
        <span className="dashboard-stat-icon">{stat.icon}</span>
      </div>
      <strong className="dashboard-stat-value">{stat.value}</strong>
      <div className="dashboard-stat-bottom">
        {stat.change && <span className={`dashboard-stat-change${stat.change.startsWith('-') ? ' is-down' : ''}`}>
          {stat.change.startsWith('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{stat.change}
        </span>}
        <span>{stat.note}</span>
      </div>
    </article>)}
  </section>;
}
