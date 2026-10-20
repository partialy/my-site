import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Flex, Popconfirm, Row, Skeleton, Space, Typography, message } from 'antd';
import { Download, HardDrive, RefreshCw, Server } from 'lucide-react';
import { createDatabaseBackup, getSystemStatus } from '../../api/systemStatus';
import type { SystemStatus } from '../../api/systemStatus';
import { formatDateTime } from '../../utils/dateTime';

const { Text, Title } = Typography;

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '暂不可用';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = -1;
  do { value /= 1024; index += 1; } while (value >= 1024 && index < units.length - 1);
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days} 天` : '', hours ? `${hours} 小时` : '', `${minutes} 分钟`].filter(Boolean).join(' ');
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, minHeight: 72 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div style={{ marginTop: 4, fontSize: 17, fontWeight: 600, color: '#0f172a' }}>{value}</div>
    </div>
  );
}

export function ServerStatusSection() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSystemStatus();
      if (!result.success) throw new Error(result.msg);
      setStatus(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '读取服务器状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const backup = async () => {
    setBackingUp(true);
    try {
      const file = await createDatabaseBackup();
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      message.success('数据库备份已生成');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '生成数据库备份失败');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <Card styles={{ body: { padding: 28 } }} style={{ borderRadius: 16 }}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Space size={16} align="start">
          <div className="system-config-icon"><Server size={20} /></div>
          <div>
            <Title level={4} style={{ margin: '0 0 5px' }}>服务器状态</Title>
            <Text type="secondary">查看当前实例的运行状态与磁盘空间。</Text>
          </div>
        </Space>
        <Button icon={<RefreshCw size={16} />} onClick={() => void reload()} loading={loading}>刷新状态</Button>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 20 }} />}
      {loading && !status ? <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 22 }} /> : status && (
        <div style={{ marginTop: 22 }}>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={8} lg={6}><StatusItem label="Node.js 版本" value={status.nodeVersion} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="运行时长" value={formatUptime(status.uptimeSeconds)} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="进程内存" value={formatBytes(status.processMemoryBytes)} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="系统可用内存" value={`${formatBytes(status.systemMemoryFreeBytes)} / ${formatBytes(status.systemMemoryTotalBytes)}`} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="CPU 负载" value={status.cpuLoadPercent === null ? '暂不可用' : `${status.cpuLoadPercent.toFixed(1)}%`} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="SQLite 数据库" value={formatBytes(status.databaseBytes)} /></Col>
            <Col xs={12} md={8} lg={6}><StatusItem label="磁盘可用空间" value={formatBytes(status.diskFreeBytes)} /></Col>
          </Row>
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>采样时间：{formatDateTime(status.sampledAt)}</Text>
        </div>
      )}

      <Flex className="system-config-subsection" justify="space-between" align="center" wrap="wrap" gap={16}>
        <Space size={12} align="start">
          <div className="system-config-small-icon"><HardDrive size={17} /></div>
          <div>
            <Text strong>SQLite 数据库备份</Text>
            <div><Text type="secondary" style={{ fontSize: 12 }}>生成并下载数据库文件；不包含上传文件，恢复文件链接需另行保留上传目录。</Text></div>
          </div>
        </Space>
        <Popconfirm title="生成数据库备份？" description="备份仅包含 SQLite 数据库，不包含上传文件。" okText="生成并下载" cancelText="取消" onConfirm={() => void backup()}>
          <Button icon={<Download size={16} />} loading={backingUp}>备份数据库</Button>
        </Popconfirm>
      </Flex>
    </Card>
  );
}
