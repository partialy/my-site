import { Space, Typography } from 'antd';
import { Palette } from 'lucide-react';
import { LoginAppearanceSection } from './LoginAppearanceSection';

const { Title, Text, Paragraph } = Typography;

export function AppearancePage() {
  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ marginBottom: 24 }}>
      <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><Palette size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>站点展示</Text></Space>
      <Title level={2} style={{ margin: 0 }}>外观设置</Title>
      <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>管理后台登录界面的背景样式、图片与卡片透明度（网站名称与图标已合并至「主页配置」）。</Paragraph>
    </div>
    <LoginAppearanceSection />
  </div>;
}
