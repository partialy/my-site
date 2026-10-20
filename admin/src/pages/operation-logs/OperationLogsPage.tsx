import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Modal, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { ClipboardList, RefreshCw } from 'lucide-react';
import type { OperationLogItem } from '../../api/operationLogs';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { formatDateTime } from '../../utils/dateTime';
import { useOperationLogs, type OperationLogFilters } from './useOperationLogs';

const { Title, Text, Paragraph } = Typography;
const actionNames: Record<string, string> = {
  create: '新增', update: '修改', delete: '删除', archive: '归档', export: '导出',
};

const filterFields: ReadonlyArray<CrudFilterField<OperationLogFilters>> = [
  { key: 'module', kind: 'text', placeholder: '搜索模块', width: 160 },
  { key: 'actor', kind: 'text', placeholder: '搜索操作人', width: 180 },
  { key: 'startTime', kind: 'datetime-local', placeholder: '开始时间', width: 190 },
  { key: 'endTime', kind: 'datetime-local', placeholder: '结束时间', width: 190 },
];

export function OperationLogsPage() {
  const [selected, setSelected] = useState<OperationLogItem | null>(null);
  const { query, result, loading, error, reload, setFilters, resetFilters, setPage } = useOperationLogs();

  const columns = useMemo<TableProps<OperationLogItem>['columns']>(() => [
    { title: '操作时间', dataIndex: 'createdAt', width: 180, render: formatDateTime },
    { title: '操作人', dataIndex: 'actorName', width: 150,
      render: (name: string, item) => <Space direction="vertical" size={0}><Text>{name}</Text><Text type="secondary">{item.actorType}</Text></Space> },
    { title: '模块', dataIndex: 'module', width: 140 },
    { title: '类型', dataIndex: 'action', width: 95,
      render: (action: string) => <Tag>{actionNames[action] ?? action}</Tag> },
    { title: '操作摘要', dataIndex: 'summary', ellipsis: true },
    { title: '目标 ID', dataIndex: 'targetId', width: 180, ellipsis: true,
      render: (value: string | null) => value || '—' },
    { title: 'IP', dataIndex: 'ip', width: 150, render: (value: string | null) => value || '—' },
    { title: '操作', key: 'actionLink', width: 90,
      render: (_, item) => <Button type="link" size="small" onClick={() => setSelected(item)}>详情</Button> },
  ], []);

  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><ClipboardList size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>业务审计</Text></Space>
        <Title level={2} style={{ margin: 0 }}>操作日志</Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>查看谁在什么时间执行了哪些业务操作。</Paragraph>
      </div>
      <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
    </Flex>
    <CrudFilterBar fields={filterFields} values={query} defaultValues={{}} onSearch={setFilters} onReset={resetFilters} />
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Table<OperationLogItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
        pagination={{ current: query.page, pageSize: query.pageSize, total: result.total,
          showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 条`,
          onChange: setPage }} />
    </Card>
    <Modal title="操作详情" open={selected !== null} footer={null} onCancel={() => setSelected(null)} width={680} destroyOnHidden>
      {selected && <Descriptions column={1} bordered size="small" styles={{ label: { width: 115 } }}>
        <Descriptions.Item label="操作时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="操作人">{selected.actorName}（{selected.actorType} / {selected.actorId ?? '—'}）</Descriptions.Item>
        <Descriptions.Item label="模块">{selected.module}</Descriptions.Item>
        <Descriptions.Item label="操作类型">{actionNames[selected.action] ?? selected.action}</Descriptions.Item>
        <Descriptions.Item label="目标类型">{selected.targetType}</Descriptions.Item>
        <Descriptions.Item label="目标 ID">{selected.targetId || '—'}</Descriptions.Item>
        <Descriptions.Item label="操作摘要">{selected.summary}</Descriptions.Item>
        <Descriptions.Item label="涉及字段">{selected.changedFields.length ? selected.changedFields.join('、') : '—'}</Descriptions.Item>
        <Descriptions.Item label="来源 IP">{selected.ip || '—'}</Descriptions.Item>
        <Descriptions.Item label="耗时">{selected.durationMs === null ? '—' : `${selected.durationMs} ms`}</Descriptions.Item>
      </Descriptions>}
    </Modal>
  </div>;
}
