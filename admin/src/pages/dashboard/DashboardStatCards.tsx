import type { ReactNode } from 'react';
import { ArrowUpRight, Eye, MousePointerClick, UserRoundPlus, UsersRound } from 'lucide-react';

interface StatCardData {
  label: string;
  value: string;
  change: string;
  note: string;
  icon: ReactNode;
  tone: string;
}

const stats: StatCardData[] = [
  { label: '今日访问量', value: '2,148', change: '+12.8%', note: '较前一日', icon: <Eye size={19} />, tone: 'blue' },
  { label: '独立访客', value: '1,324', change: '+8.2%', note: '较前一日', icon: <UsersRound size={19} />, tone: 'teal' },
  { label: '本周新增用户', value: '302', change: '+18.6%', note: '较上周', icon: <UserRoundPlus size={19} />, tone: 'orange' },
  { label: '页面互动量', value: '6,892', change: '+5.4%', note: '较前一日', icon: <MousePointerClick size={19} />, tone: 'slate' },
];

export function DashboardStatCards() {
  return <section className="dashboard-stats" aria-label="关键指标">
    {stats.map((stat) => <article className={`dashboard-stat dashboard-stat-${stat.tone}`} key={stat.label}>
      <div className="dashboard-stat-top">
        <span className="dashboard-stat-label">{stat.label}</span>
        <span className="dashboard-stat-icon">{stat.icon}</span>
      </div>
      <strong className="dashboard-stat-value">{stat.value}</strong>
      <div className="dashboard-stat-bottom">
        <span className="dashboard-stat-change"><ArrowUpRight size={14} />{stat.change}</span>
        <span>{stat.note}</span>
      </div>
    </article>)}
  </section>;
}
