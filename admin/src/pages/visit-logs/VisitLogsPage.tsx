import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Modal, Space, Table, Typography } from 'antd';
import type { TableProps } from 'antd';
import { BarChart3, RefreshCw } from 'lucide-react';
import type { VisitLogItem } from '../../api/visits';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { formatDateTime } from '../../utils/dateTime';
import { useVisitLogs, type VisitLogFilters } from './useVisitLogs';

const { Title, Text, Paragraph } = Typography;
const filterFields: ReadonlyArray<CrudFilterField<VisitLogFilters>> = [
  { key: 'path', kind: 'text', placeholder: '搜索页面路径', width: 240 },
  { key: 'visitorId', kind: 'text', placeholder: '搜索访客 ID', width: 240 },
  { key: 'startDay', kind: 'date', placeholder: '开始日期', width: 155 },
  { key: 'endDay', kind: 'date', placeholder: '结束日期', width: 155 },
];

export function VisitLogsPage() {
  const [selected, setSelected] = useState<VisitLogItem | null>(null);
  const { query, result, loading, error, reload, setFilters, resetFilters, setPage } = useVisitLogs();

  const columns = useMemo<TableProps<VisitLogItem>['columns']>(() => [
    { title: '访问时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: formatDateTime },
    { title: '页面', dataIndex: 'path', key: 'path', ellipsis: true,
      render: (value: string, item) => <Space direction="vertical" size={0}>
        <Text ellipsis={{ tooltip: value }}>{value}</Text>
        {item.pageTitle && <Text type="secondary" ellipsis={{ tooltip: item.pageTitle }}>{item.pageTitle}</Text>}
      </Space> },
    { title: '访客 ID', dataIndex: 'visitorId', key: 'visitorId', width: 250, ellipsis: true,
      render: (value: string) => <Text copyable={{ text: value }} ellipsis={{ tooltip: value }}>{value}</Text> },
    { title: '来源 IP', dataIndex: 'ip', key: 'ip', width: 155,
      render: (value: string | null) => value || '—' },
    { title: '来源站点', dataIndex: 'referrer', key: 'referrer', width: 180, ellipsis: true,
      render: (value: string) => value || '—' },
    { title: '操作', key: 'actions', width: 90,
      render: (_, item) => <Button type="link" size="small" onClick={() => setSelected(item)}>详情</Button> },
  ], []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><BarChart3 size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>访客记录</Text></Space>
          <Title level={2} style={{ margin: 0 }}>访问日志</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>查看每天首次上报的访客和入口页面。日期按 UTC 统计。</Paragraph>
        </div>
        <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
      </Flex>
      <CrudFilterBar fields={filterFields} values={query} defaultValues={{}} onSearch={setFilters} onReset={resetFilters} />
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<VisitLogItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
          pagination={{ current: query.page, pageSize: query.pageSize, total: result.total,
            showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 条`,
            onChange: setPage }} />
      </Card>
      <Modal title="访问详情" open={selected !== null} footer={null} onCancel={() => setSelected(null)} width={680} destroyOnHidden>
        {selected && <Descriptions column={1} bordered size="small" styles={{ label: { width: 110 } }}>
          <Descriptions.Item label="访问时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="统计日期">{selected.day}（UTC）</Descriptions.Item>
          <Descriptions.Item label="访客 ID"><Text copyable>{selected.visitorId}</Text></Descriptions.Item>
          <Descriptions.Item label="页面路径">{selected.path}</Descriptions.Item>
          <Descriptions.Item label="页面标题">{selected.pageTitle || '—'}</Descriptions.Item>
          <Descriptions.Item label="来源站点">{selected.referrer || '—'}</Descriptions.Item>
          <Descriptions.Item label="来源 IP">{selected.ip || '—'}</Descriptions.Item>
          <Descriptions.Item label="User-Agent"><Text style={{ overflowWrap: 'anywhere' }}>{selected.userAgent || '—'}</Text></Descriptions.Item>
        </Descriptions>}
      </Modal>
    </div>
  );
}
