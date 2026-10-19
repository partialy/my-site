import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowUpRight, BarChart3, Globe2, UsersRound } from 'lucide-react';
import type { DashboardData } from '../../api/dashboard';

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

const sourceColors = ['#2463eb', '#14b8a6', '#f59e0b', '#cbd5e1'];

export function DashboardCharts({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const trend = (period === '7d' ? data.visits.trend7 : data.visits.trend30)
    .map((point) => ({ ...point, label: point.day.slice(5) }));
  const sources = data.requestLogs.sources.map((source, index) => ({
    ...source, color: sourceColors[index % sourceColors.length],
  }));
  const maxPathCount = Math.max(1, ...data.requestLogs.topPaths.map((item) => item.count));
  const userTrend = data.users.trend7.map((point) => ({ ...point, label: point.day.slice(5) }));

  return <>
    <section className="dashboard-chart-grid">
      <article className="dashboard-panel dashboard-traffic-panel">
        <ChartHeading icon={<BarChart3 size={18} />} title="访问趋势" subtitle="前台访问量 · 每个访客每日去重"
          extra={<div className="dashboard-period" aria-label="选择访问趋势时间范围">
            <button type="button" className={period === '7d' ? 'active' : ''} onClick={() => setPeriod('7d')}>近 7 天</button>
            <button type="button" className={period === '30d' ? 'active' : ''} onClick={() => setPeriod('30d')}>近 30 天</button>
          </div>} />
        <div className="dashboard-chart-legend"><span className="blue">访问量</span></div>
        <div className="dashboard-chart-area">
          <ResponsiveContainer width="100%" height={278}>
            <AreaChart data={trend} margin={{ top: 10, right: 5, bottom: 0, left: -22 }}>
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="dashboard-panel dashboard-users-panel">
        <ChartHeading icon={<UsersRound size={18} />} title="新增用户"
          subtitle={data.users.source === 'mock' ? '演示数据 · 等待业务用户模块接入' : '近 7 天用户变化'} />
        <div className="dashboard-users-summary"><strong>{data.users.newLast7Days.toLocaleString('zh-CN')}</strong><span>近 7 天累计新增</span></div>
        <div className="dashboard-chart-area">
          <ResponsiveContainer width="100%" height={278}>
            <BarChart data={userTrend} margin={{ top: 12, right: 0, bottom: 0, left: -28 }} barGap={3}>
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
        <ChartHeading icon={<Globe2 size={18} />} title="接口来源" subtitle="近 7 天请求日志中的 Origin / Referer" />
        {sources.length === 0 ? <div className="dashboard-empty">暂无接口日志，开启日志记录后展示来源分布</div> : <div className="dashboard-source-content">
          <div className="dashboard-donut-wrap">
            <ResponsiveContainer width="100%" height={205}>
              <PieChart>
                <Pie data={sources} dataKey="count" nameKey="name" innerRadius={64} outerRadius={90}
                  paddingAngle={3} stroke="none">
                  {sources.map((source) => <Cell key={source.name} fill={source.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} 次`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-donut-center"><strong>{data.requestLogs.total}</strong><span>接口请求</span></div>
          </div>
          <div className="dashboard-source-list">
            {sources.map((source) => <div key={source.name}>
              <span><i style={{ background: source.color }} />{source.name}</span>
              <strong>{data.requestLogs.total ? Math.round(source.count / data.requestLogs.total * 100) : 0}%</strong>
            </div>)}
          </div>
        </div>}
      </article>

      <article className="dashboard-panel dashboard-pages-panel">
        <ChartHeading icon={<ArrowUpRight size={18} />} title="热门接口" subtitle="近 7 天请求次数最多的接口路径" />
        {data.requestLogs.topPaths.length === 0 ? <div className="dashboard-empty">暂无接口日志，开启日志记录后展示热门接口</div>
          : <div className="dashboard-pages-list">
          {data.requestLogs.topPaths.map((page, index) => <div className="dashboard-page-row" key={page.path}>
            <span className="dashboard-page-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="dashboard-page-details">
              <div><strong>{page.path}</strong></div>
              <div className="dashboard-page-track"><span style={{ width: `${page.count / maxPathCount * 100}%` }} /></div>
            </div>
            <strong className="dashboard-page-visits">{page.count.toLocaleString('zh-CN')}</strong>
          </div>)}
        </div>}
      </article>
    </section>
  </>;
}
