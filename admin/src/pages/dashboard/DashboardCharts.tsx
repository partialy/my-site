import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowUpRight, BarChart3, Globe2, UsersRound } from 'lucide-react';
import { popularPages, trafficSources, trafficTrends, weeklyUsers } from './dashboardData';

const tooltipStyle = {
  border: '1px solid #e8edf4', borderRadius: 10, boxShadow: '0 12px 30px rgba(15, 23, 42, .1)',
  fontSize: 12,
};

function ChartHeading({ icon, title, subtitle, extra }: {
  icon: ReactNode; title: string; subtitle: string; extra?: ReactNode;
}) {
  return <div className="dashboard-panel-heading">
    <div className="dashboard-panel-title-group">
      <span className="dashboard-panel-icon">{icon}</span>
      <div><h2>{title}</h2><p>{subtitle}</p></div>
    </div>
    {extra}
  </div>;
}

export function DashboardCharts() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  return <>
    <section className="dashboard-chart-grid">
      <article className="dashboard-panel dashboard-traffic-panel">
        <ChartHeading icon={<BarChart3 size={18} />} title="访问趋势" subtitle="访问量与独立访客走势"
          extra={<div className="dashboard-period" aria-label="选择访问趋势时间范围">
            <button type="button" className={period === '7d' ? 'active' : ''} onClick={() => setPeriod('7d')}>近 7 天</button>
            <button type="button" className={period === '30d' ? 'active' : ''} onClick={() => setPeriod('30d')}>近 30 天</button>
          </div>} />
        <div className="dashboard-chart-legend"><span className="blue">访问量</span><span className="teal">独立访客</span></div>
        <div className="dashboard-chart-area">
          <ResponsiveContainer width="100%" height={278}>
            <AreaChart data={trafficTrends[period]} margin={{ top: 10, right: 5, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="dashboardVisitsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf1f6" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="visits" name="访问量" stroke="#2563eb" strokeWidth={3}
                fill="url(#dashboardVisitsFill)" activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="users" name="独立访客" stroke="#14b8a6" strokeWidth={2.5}
                strokeDasharray="5 4" fill="transparent" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="dashboard-panel dashboard-users-panel">
        <ChartHeading icon={<UsersRound size={18} />} title="新增用户" subtitle="本周新增与活跃用户" />
        <div className="dashboard-users-summary"><strong>302</strong><span>本周累计新增</span><span className="dashboard-users-rise">+18.6%</span></div>
        <div className="dashboard-chart-area">
          <ResponsiveContainer width="100%" height={278}>
            <BarChart data={weeklyUsers} margin={{ top: 12, right: 0, bottom: 0, left: -28 }} barGap={3}>
              <CartesianGrid stroke="#edf1f6" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="activeUsers" name="活跃用户" fill="#cbdcfb" radius={[5, 5, 0, 0]} maxBarSize={23} />
              <Bar dataKey="newUsers" name="新增用户" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={23} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>

    <section className="dashboard-chart-grid dashboard-bottom-grid">
      <article className="dashboard-panel dashboard-source-panel">
        <ChartHeading icon={<Globe2 size={18} />} title="流量来源" subtitle="不同渠道带来的访问占比" />
        <div className="dashboard-source-content">
          <div className="dashboard-donut-wrap">
            <ResponsiveContainer width="100%" height={205}>
              <PieChart>
                <Pie data={trafficSources} dataKey="value" nameKey="name" innerRadius={64} outerRadius={90}
                  paddingAngle={3} stroke="none">
                  {trafficSources.map((source) => <Cell key={source.name} fill={source.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-donut-center"><strong>100%</strong><span>总访问来源</span></div>
          </div>
          <div className="dashboard-source-list">
            {trafficSources.map((source) => <div key={source.name}>
              <span><i style={{ background: source.color }} />{source.name}</span>
              <strong>{source.value}%</strong>
            </div>)}
          </div>
        </div>
      </article>

      <article className="dashboard-panel dashboard-pages-panel">
        <ChartHeading icon={<ArrowUpRight size={18} />} title="热门页面" subtitle="按访问量排序的页面表现" />
        <div className="dashboard-pages-list">
          {popularPages.map((page, index) => <div className="dashboard-page-row" key={page.path}>
            <span className="dashboard-page-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="dashboard-page-details">
              <div><strong>{page.label}</strong><span>{page.path}</span></div>
              <div className="dashboard-page-track"><span style={{ width: `${page.share}%` }} /></div>
            </div>
            <strong className="dashboard-page-visits">{page.visits.toLocaleString('zh-CN')}</strong>
          </div>)}
        </div>
      </article>
    </section>
  </>;
}
