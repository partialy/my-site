import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Alert, Button, Card, Col, Flex, Modal, Popconfirm, Row, Skeleton, Space, Typography, message } from 'antd';
import { Archive, Download, HardDrive, RefreshCw, Server, Upload } from 'lucide-react';
import {
  createDatabaseBackup,
  exportConfigPackage,
  getSystemStatus,
  importConfigPackage,
} from '../../api/systemStatus';
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
  const [exportingPkg, setExportingPkg] = useState(false);
  const [importingPkg, setImportingPkg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pkgInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleExportPackage = async () => {
    setExportingPkg(true);
    try {
      const file = await exportConfigPackage();
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      message.success('配置与作品 ZIP 包已导出');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '导出配置包失败');
    } finally {
      setExportingPkg(false);
    }
  };

  const executeImportPackage = async (file: File) => {
    setImportingPkg(true);
    try {
      const res = await importConfigPackage(file);
      if (!res.success) throw new Error(res.msg);
      const result = res.data;
      Modal.success({
        title: '配置包导入成功',
        content: (
          <div style={{ lineHeight: 1.8 }}>
            <div>已导入作品 {result.worksCount} 个、系统配置 {result.sysConfigsCount} 项、参数配置 {result.configsCount} 项、菜单 {result.menusCount} 条、字典 {result.dictionariesCount} 类。</div>
            {result.unlinkedFileRefs > 0 ? (
              <div style={{ marginTop: 8, color: '#d97706' }}>
                提示：有 {result.unlinkedFileRefs} 处本地文件库引用在当前环境不存在，已自动解绑文件 ID 并保留原图片链接。
              </div>
            ) : null}
          </div>
        ),
        okText: '刷新页面以应用菜单与站点设置',
        onOk: () => window.location.reload(),
      });
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '导入配置包失败');
    } finally {
      setImportingPkg(false);
    }
  };

  const handleSelectPackageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      message.warning('请选择 .zip 格式的配置导出包');
      return;
    }
    Modal.confirm({
      title: '确认导入配置与作品包？',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>将从 <strong>{file.name}</strong> 恢复作品数据、主页配置、系统配置、参数配置、菜单配置与数据字典，并覆盖当前对应配置。</p>
          <p style={{ marginBottom: 0, color: '#64748b' }}>不会修改访问日志、请求日志、操作日志与管理员账号；建议导入前先导出一份当前 ZIP 包备份。</p>
        </div>
      ),
      okText: '确认导入并覆盖',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => executeImportPackage(file),
    });
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

      <Flex className="system-config-subsection" justify="space-between" align="center" wrap="wrap" gap={16}>
        <Space size={12} align="start">
          <div className="system-config-small-icon"><Archive size={17} /></div>
          <div>
            <Text strong>配置与作品包导入导出（ZIP）</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                包含作品数据、主页配置、系统配置、参数配置、菜单配置与数据字典；不包含访问日志、请求日志、操作日志及账号数据。
              </Text>
            </div>
          </div>
        </Space>
        <Space wrap>
          <input
            ref={pkgInputRef}
            type="file"
            accept=".zip,application/zip"
            style={{ display: 'none' }}
            onChange={handleSelectPackageFile}
          />
          <Button
            icon={<Download size={16} />}
            loading={exportingPkg}
            disabled={importingPkg}
            onClick={() => void handleExportPackage()}
          >
            一键导出 ZIP
          </Button>
          <Button
            type="primary"
            ghost
            icon={<Upload size={16} />}
            loading={importingPkg}
            disabled={exportingPkg}
            onClick={() => pkgInputRef.current?.click()}
          >
            导入配置包
          </Button>
        </Space>
      </Flex>
    </Card>
  );
}
