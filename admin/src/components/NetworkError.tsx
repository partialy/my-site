import React, { useState } from 'react';
import { Button, Result, Typography, Card, Space } from 'antd';
import { WifiOff, RotateCw, Network } from 'lucide-react';
import { getApiBaseUrl } from '../api';

const { Text, Paragraph } = Typography;

interface NetworkErrorProps {
  message?: string | null;
  onRetry: () => Promise<void> | void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ message, onRetry }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const baseUrl = getApiBaseUrl();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: '#f8fafc',
      }}
    >
      <Card
        style={{
          maxWidth: 520,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
        }}
      >
        <Result
          icon={
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                fontSize: 32,
              }}
            >
              <WifiOff size={36} />
            </div>
          }
          status="error"
          title={<span style={{ fontSize: 20, fontWeight: 600 }}>服务暂不可用</span>}
          subTitle={
            <div style={{ marginTop: 8 }}>
              <Paragraph style={{ color: '#64748b', marginBottom: 16 }}>
                {message || '无法与后端服务建立连接，请确认服务已启动或网络通畅。'}
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <Space size="middle">
                    <Text type="secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Network size={14} style={{ marginRight: 6 }} />
                      目标基础路径:
                    </Text>
                    <Text code>{baseUrl}</Text>
                  </Space>
                </div>
              </Space>
            </div>
          }
          extra={[
            <Button
              key="retry"
              type="primary"
              icon={<RotateCw size={16} />}
              loading={retrying}
              onClick={handleRetry}
              size="large"
              style={{ minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              重新连接
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};
