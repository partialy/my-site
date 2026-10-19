import React from 'react';
import { Result, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的管理后台页面不存在或已被移除。"
        extra={
          <Space size="middle">
            <Button
              type="primary"
              icon={<Home size={16} />}
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              返回后台首页
            </Button>
            <Button
              icon={<LogIn size={16} />}
              onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              返回登录页
            </Button>
          </Space>
        }
      />
    </div>
  );
};
