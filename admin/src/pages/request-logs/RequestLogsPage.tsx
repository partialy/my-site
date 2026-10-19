import { useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { FileText, RefreshCw, Search } from 'lucide-react';
import type { RequestLogItem, RequestLogQuery } from '../../api/requestLogs';
import { RequestLogDetail } from './RequestLogDetail';
import { useRequestLogs } from './useRequestLogs';

const { Title, Text, Paragraph } = Typography;
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map((value) => ({ label: value, value }));

export function RequestLogsPage() {
  const [path, setPath] = useState('');
  const [method, setMethod] = useState<string | undefined>();
  const [statusDraft, setStatusDraft] = useState('');
  const [query, setQuery] = useState<RequestLogQuery>({ page: 1, pageSize: 10 });
  const [selected, setSelected] = useState<RequestLogItem | null>(null);
  const { result, loading, error, reload } = useRequestLogs(query);

  const search = () => setQuery((current) => ({ ...current, page: 1, path: path.trim() || undefined,
    method, status: /^\d{3}$/.test(statusDraft) ? Number(statusDraft) : undefined }));
  const reset = () => {
    setPath('');
    setMethod(undefined);
    setStatusDraft('');
    setQuery({ page: 1, pageSize: 10 });
  };

  const columns = useMemo<TableProps<RequestLogItem>['columns']>(() => [
    { title: '时间', dataIndex: 'time', key: 'time', width: 190 },
    { title: '方法', dataIndex: 'method', key: 'method', width: 90,
      render: (value: string) => <Tag color={value === 'GET' ? 'blue' : value === 'DELETE' ? 'red' : 'geekblue'}>{value}</Tag> },
    { title: '请求地址', dataIndex: 'url', key: 'url', ellipsis: true,
      render: (value: string) => <Text ellipsis={{ tooltip: value }}>{value}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (value: number) => <Tag color={value >= 500 ? 'error' : value >= 400 ? 'warning' : 'success'}>{value}</Tag> },
    { title: '耗时', dataIndex: 'durationMs', key: 'durationMs', width: 110,
      render: (value: number) => `${value} ms` },
    { title: '来源 IP', dataIndex: 'ip', key: 'ip', width: 160,
      render: (value: string | null) => value || '—' },
    { title: '操作', key: 'actions', width: 90,
      render: (_, item) => <Button type="link" size="small" onClick={() => setSelected(item)}>详情</Button> },
  ], []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><FileText size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>请求记录</Text></Space>
          <Title level={2} style={{ margin: 0 }}>请求日志</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>查看已记录的接口请求、响应和来源信息。</Paragraph>
        </div>
        <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
      </Flex>
      <Card style={{ marginBottom: 16, borderRadius: 16 }}>
        <Flex wrap="wrap" gap={12} align="center">
          <Input placeholder="搜索接口路径" value={path} onChange={(event) => setPath(event.target.value)} onPressEnter={search} style={{ width: 280 }} allowClear />
          <Select placeholder="请求方法" value={method} onChange={setMethod} options={methodOptions} style={{ width: 140 }} allowClear />
          <Input placeholder="状态码，如 200" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value.replace(/\D/g, '').slice(0, 3))}
            onPressEnter={search} style={{ width: 160 }} inputMode="numeric" allowClear />
          <Button type="primary" icon={<Search size={16} />} onClick={search}>查询</Button>
          <Button onClick={reset}>重置</Button>
        </Flex>
      </Card>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<RequestLogItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
          pagination={{ current: query.page, pageSize: query.pageSize, total: result.total,
            showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setQuery((current) => ({ ...current, page, pageSize })) }} />
      </Card>
      <RequestLogDetail item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
