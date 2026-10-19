import React, { useState } from 'react';
import { Alert, Button, Card, Col, Row, Space, Typography } from 'antd';
import { ArrowRight, CircleCheck, KeyRound, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../auth';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

const { Title, Text, Paragraph } = Typography;

export const DashboardPage: React.FC = () => {
  const { state, checkStatusAndSession } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await checkStatusAndSession();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Card
        style={{
          marginBottom: 24,
          border: 0,
          borderRadius: 18,
          background: 'linear-gradient(120deg, #0f172a, #1d4ed8)',
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.14)',
        }}
        styles={{ body: { padding: '32px 36px' } }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={17}>
            <Space align="center" size="small" style={{ color: '#bfdbfe', marginBottom: 14 }}>
              <CircleCheck size={16} />
              <span>系统已就绪</span>
            </Space>
            <Title level={2} style={{ color: '#fff', margin: '0 0 8px' }}>
              欢迎回来，{state.admin?.username ?? '管理员'}
            </Title>
            <Paragraph style={{ color: '#cbd5e1', margin: 0, maxWidth: 560 }}>
              管理员会话已通过服务端校验。后续项目的业务页面可以从这里进入。
            </Paragraph>
          </Col>
          <Col xs={24} md={7} style={{ textAlign: 'right' }}>
            <Button
              size="large"
              icon={<KeyRound size={16} />}
              onClick={() => setPasswordModalOpen(true)}
            >
              修改密码
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card" styles={{ body: { padding: 24 } }}>
            <Space direction="vertical" size={12}>
              <UserRound size={22} color="#2563eb" />
              <Text type="secondary">当前管理员</Text>
              <Text strong style={{ fontSize: 22 }}>{state.admin?.username ?? '—'}</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card" styles={{ body: { padding: 24 } }}>
            <Space direction="vertical" size={12}>
              <ShieldCheck size={22} color="#059669" />
              <Text type="secondary">身份验证</Text>
              <Text strong style={{ fontSize: 22 }}>已登录</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card" styles={{ body: { padding: 24 } }}>
            <Space direction="vertical" size={12}>
              <CircleCheck size={22} color="#7c3aed" />
              <Text type="secondary">初始化状态</Text>
              <Text strong style={{ fontSize: 22 }}>
                {state.initialized ? '已完成' : '待初始化'}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: 28 } }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} md={17}>
            <Title level={4} style={{ margin: '0 0 8px' }}>业务概览</Title>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              当前基础框架只提供管理员登录和配置存储。具体项目接入业务模块后，可以在这里展示真实数据。
            </Paragraph>
            <Alert
              type="info"
              showIcon
              message="尚未接入业务数据"
              description="此处不会展示预设的访问量、订单或日志数据。"
            />
          </Col>
          <Col xs={24} md={7} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<RefreshCw size={16} />}
              loading={refreshing}
              onClick={refresh}
            >
              检查连接
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Text type="secondary">
          管理端基础功能已启用 <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
        </Text>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};
