import { useState } from 'react';
import { Alert, Button, Card, Flex, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { Pencil, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import type { ConfigItem } from '../../api/configs';
import { ConfigEditor } from './ConfigEditor';
import { useConfigs } from './useConfigs';
import { formatDateTime } from '../../utils/dateTime';

const { Title, Text, Paragraph } = Typography;

export function ConfigsPage() {
  const { items, loading, saving, error, reload, save, remove } = useConfigs();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);

  const openEditor = (item: ConfigItem | null) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const columns: TableProps<ConfigItem>['columns'] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 170, render: (name: string) => <Text strong>{name}</Text> },
    { title: '键', dataIndex: 'key', key: 'key', width: 170, render: (key: string) => <Text code>{key}</Text> },
    { title: '值', dataIndex: 'value', key: 'value', ellipsis: true, render: (value: string) => <Text ellipsis={{ tooltip: value }}>{value || '—'}</Text> },
    { title: '状态', dataIndex: 'enabled', key: 'enabled', width: 90, render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '停用'}</Tag> },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 180, ellipsis: true, render: (remark: string) => remark || '—' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 190, render: formatDateTime },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 190, render: formatDateTime },
    {
      title: '操作', key: 'actions', width: 145,
      render: (_, item) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => openEditor(item)}>编辑</Button>
          <Popconfirm title="删除配置" description={`确定删除“${item.name}”吗？`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => void remove(item.key)}>
            <Button type="link" size="small" danger icon={<Trash2 size={14} />} disabled={saving}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><Settings2 size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>动态配置</Text></Space>
          <Title level={2} style={{ margin: 0 }}>配置管理</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>维护业务可读取的配置项，停用后配置不会生效。</Paragraph>
        </div>
        <Space>
          <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => openEditor(null)}>新增配置</Button>
        </Space>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<ConfigItem> rowKey="key" columns={columns} dataSource={items} loading={loading} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
      <ConfigEditor open={editorOpen} item={editingItem} saving={saving} onClose={() => setEditorOpen(false)} onSave={save} />
    </div>
  );
}
