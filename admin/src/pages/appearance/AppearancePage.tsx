import { Space, Typography } from 'antd';
import { Palette } from 'lucide-react';
import { LoginAppearanceSection } from './LoginAppearanceSection';
import { SiteIdentitySection } from './SiteIdentitySection';

const { Title, Text, Paragraph } = Typography;

export function AppearancePage() {
  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ marginBottom: 24 }}>
      <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><Palette size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>站点展示</Text></Space>
      <Title level={2} style={{ margin: 0 }}>外观设置</Title>
      <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>管理网站信息、图标和后台登录界面的背景。</Paragraph>
    </div>
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <SiteIdentitySection />
      <LoginAppearanceSection />
    </Space>
  </div>;
}
