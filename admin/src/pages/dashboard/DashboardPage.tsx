import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined } from 'lucide-react';
import { useAuth } from '../../auth';
import { DashboardCharts } from './DashboardCharts';
import { DashboardStatCards } from './DashboardStatCards';
import './dashboard.css';

export function DashboardPage() {
  const { state } = useAuth();
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return <main className="dashboard-page">
    <header className="dashboard-header">
      <div>
        <div className="dashboard-eyebrow"><ChartNoAxesCombined size={16} /> OVERVIEW / 工作台</div>
        <h1>数据总览</h1>
        <p>欢迎回来，{state.admin?.username ?? '管理员'}。这里展示项目运行的关键指标。</p>
      </div>
      <div className="dashboard-header-date"><CalendarDays size={16} />{today}</div>
    </header>

    <section className="dashboard-intro" aria-label="数据说明">
      <div className="dashboard-intro-copy">
        <span className="dashboard-demo-tag"><i /> 演示数据</span>
        <h2>一眼掌握业务动态</h2>
        <p>当前指标和图表使用示例数据，接入具体项目后可替换为真实统计。</p>
      </div>
      <Link className="dashboard-intro-link" to="/request-logs">查看请求日志 <ArrowUpRight size={16} /></Link>
      <div className="dashboard-intro-decoration" aria-hidden="true"><span /><span /><span /><span /></div>
    </section>

    <DashboardStatCards />
    <DashboardCharts />
  </main>;
}
