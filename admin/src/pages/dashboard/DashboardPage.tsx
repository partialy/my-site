import { Alert, Button, Spin } from 'antd';
import { CalendarDays, ChartNoAxesCombined, RefreshCw } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { DashboardStatCards } from './DashboardStatCards';
import { useDashboard } from './useDashboard';
import './dashboard.css';

export function DashboardPage() {
  const { data, loading, error, reload } = useDashboard();
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return <main className="dashboard-page">
    <header className="dashboard-header">
      <div>
        <div className="dashboard-eyebrow"><ChartNoAxesCombined size={16} /> OVERVIEW / 工作台</div>
        <h1>数据总览</h1>
      </div>
      <div className="dashboard-header-actions">
        <div className="dashboard-header-date"><CalendarDays size={16} />{today}</div>
        <Button icon={<RefreshCw size={15} />} loading={loading} onClick={() => void reload()}>刷新</Button>
      </div>
    </header>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    {!data && loading ? <div className="dashboard-loading"><Spin /></div> : data && <>
      <DashboardStatCards data={data} />
      <DashboardCharts data={data} />
    </>}
  </main>;
}
