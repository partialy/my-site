import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, message, Modal, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import { cleanupRequestLogs } from '../../api/requestLogs';
import type { RequestLogCleanup, RequestLogItem } from '../../api/requestLogs';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { RequestLogDetail } from './RequestLogDetail';
import { RequestLogCleanupModal } from './RequestLogCleanupModal';
import { useRequestLogs, type RequestLogFilters } from './useRequestLogs';
import { formatDateTime } from '../../utils/dateTime';

const { Title, Text, Paragraph } = Typography;
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map((value) => ({ label: value, value }));
const filterFields: ReadonlyArray<CrudFilterField<RequestLogFilters>> = [
  { key: 'path', kind: 'text', placeholder: '搜索接口路径', width: 280 },
  { key: 'method', kind: 'select', placeholder: '请求方法', width: 140, options: methodOptions },
  {
    key: 'status', kind: 'text', placeholder: '状态码，如 200', width: 160, maxLength: 3,
    inputMode: 'numeric', normalize: (value) => value.replace(/\D/g, '').slice(0, 3)
  },
];

export function RequestLogsPage() {
  const [selected, setSelected] = useState<RequestLogItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const { query, result, loading, error, reload, setFilters, resetFilters, setPage } = useRequestLogs();

  const search = useCallback((filters: RequestLogFilters, replace?: boolean) => {
    setSelectedIds([]);
    setFilters(filters, replace);
  }, [setFilters]);
  const reset = useCallback(() => {
    setSelectedIds([]);
    resetFilters();
  }, [resetFilters]);

  const cleanup = async (input: RequestLogCleanup) => {
    setCleaning(true);
    try {
      const response = await cleanupRequestLogs(input);
      if (!response.success) throw new Error(response.msg);
      message.success(`已清理 ${response.data.deleted} 条请求日志`);
      setSelectedIds([]);
      setSelected(null);
      if (query.page > 1) setPage(1, query.pageSize);
      else reload();
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '清理请求日志失败');
      throw cause;
    } finally {
      setCleaning(false);
    }
  };

  const confirmSelectedCleanup = () => {
    const ids = [...selectedIds];
    Modal.confirm({
      title: `清理选中的 ${ids.length} 条请求日志？`,
      content: '清理后无法恢复。', okText: '确认清理', okType: 'danger', cancelText: '取消',
      onOk: () => cleanup({ mode: 'ids', ids }),
    });
  };

  const columns = useMemo<TableProps<RequestLogItem>['columns']>(() => [
    { title: '时间', dataIndex: 'time', key: 'time', width: 190, render: formatDateTime },
    {
      title: '方法', dataIndex: 'method', key: 'method', width: 90,
      render: (value: string) => <Tag color={value === 'GET' ? 'blue' : value === 'DELETE' ? 'red' : 'geekblue'}>{value}</Tag>
    },
    {
      title: '请求地址', dataIndex: 'url', key: 'url', ellipsis: true,
      render: (value: string) => <Text ellipsis={{ tooltip: value }}>{value}</Text>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (value: number) => <Tag color={value >= 500 ? 'error' : value >= 400 ? 'warning' : 'success'}>{value}</Tag>
    },
    {
      title: '耗时', dataIndex: 'durationMs', key: 'durationMs', width: 110,
      render: (value: number) => `${value} ms`
    },
    {
      title: '来源 IP', dataIndex: 'ip', key: 'ip', width: 160,
      render: (value: string | null) => value || '—'
    },
    {
      title: '操作', key: 'actions', width: 90, fixed: 'right',
      render: (_, item) => <Button type="link" size="small" onClick={() => setSelected(item)}>详情</Button>
    },
  ], []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><FileText size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>请求记录</Text></Space>
          <Title level={2} style={{ margin: 0 }}>请求日志</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>查看已记录的接口请求、响应和来源信息。</Paragraph>
        </div>
        <Space wrap>
          <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
          <Button danger icon={<Trash2 size={16} />} disabled={cleaning} onClick={() => setCleanupOpen(true)}>按规则清理</Button>
          <Button danger icon={<Trash2 size={16} />} disabled={selectedIds.length === 0 || cleaning}
            onClick={confirmSelectedCleanup}>清理选中{selectedIds.length ? `（${selectedIds.length}）` : ''}</Button>
        </Space>
      </Flex>
      <CrudFilterBar fields={filterFields} values={query} defaultValues={{}} onSearch={search} onReset={reset} />
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<RequestLogItem> rowKey="uuid" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedIds, preserveSelectedRowKeys: true,
            onChange: (keys) => setSelectedIds(keys.map(String))
          }}
          pagination={{
            current: query.page, pageSize: query.pageSize, total: result.total,
            showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 条`,
            onChange: setPage
          }} />
      </Card>
      <RequestLogDetail item={selected} onClose={() => setSelected(null)} />
      <RequestLogCleanupModal open={cleanupOpen} onClose={() => setCleanupOpen(false)}
        onConfirm={cleanup} />
    </div>
  );
}
