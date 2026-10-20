import { useState } from 'react';
import { Alert, Button, Card, Col, Empty, Flex, Input, Row, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { BookOpen, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import type { DictItem, DictType } from '../../api/dictionaries';
import { formatDateTime } from '../../utils/dateTime';
import { DictionaryItemEditor } from './DictionaryItemEditor';
import { DictionaryTypeEditor } from './DictionaryTypeEditor';
import { useDictionaries } from './useDictionaries';

const { Title, Text, Paragraph } = Typography;

export function DictionariesPage() {
  const {
    selectedType, selectedId, setSelectedId, search, setSearch, currentPage, pageSize,
    filteredTypes, filteredTotal, changePage, loading, saving, error, reload, saveTypes, saveItems,
  } = useDictionaries();
  const [typeEditorOpen, setTypeEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictType | null>(null);
  const [itemEditorOpen, setItemEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictItem | null>(null);

  const openTypeEditor = (type: DictType | null) => {
    setEditingType(type);
    setTypeEditorOpen(true);
  };
  const openItemEditor = (item: DictItem | null) => {
    setEditingItem(item);
    setItemEditorOpen(true);
  };

  const typeColumns: TableProps<DictType>['columns'] = [
    { title: '字典类型', key: 'name', render: (_, type) => (
      <Space direction="vertical" size={1}><Text strong>{type.name}</Text><Text code>{type.code}</Text></Space>
    ) },
    { title: '状态', key: 'enabled', width: 78, render: (_, type) =>
      <Tag color={type.enabled ? 'success' : 'default'}>{type.enabled ? '启用' : '停用'}</Tag> },
    { title: '操作', key: 'actions', width: 76, render: (_, type) =>
      <Button type="link" size="small" icon={<Pencil size={14} />} onClick={(event) => {
        event.stopPropagation(); openTypeEditor(type);
      }}>编辑</Button> },
  ];
  const itemColumns: TableProps<DictItem>['columns'] = [
    { title: '显示名称', dataIndex: 'label', key: 'label', render: (label: string) => <Text strong>{label}</Text> },
    { title: '值', dataIndex: 'value', key: 'value', render: (value: string) => <Text code>{value}</Text> },
    { title: '徽章', key: 'color', render: (_, item) =>
      <Tag color={item.color === 'default' ? undefined : item.color}>{item.label}</Tag> },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 76 },
    { title: '状态', key: 'enabled', width: 84, render: (_, item) =>
      <Tag color={item.enabled ? 'success' : 'default'}>{item.enabled ? '启用' : '停用'}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 165, render: formatDateTime },
    { title: '操作', key: 'actions', width: 76, render: (_, item) =>
      <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => openItemEditor(item)}>编辑</Button> },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><BookOpen size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>业务选项</Text></Space>
          <Title level={2} style={{ margin: 0 }}>数据字典</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>维护可复用的选项与展示颜色；已使用的标识和值通过停用保留。</Paragraph>
        </div>
        <Space>
          <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => openTypeEditor(null)}>新增类型</Button>
        </Space>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="字典类型" styles={{ body: { padding: 0 } }} style={{ borderRadius: 16 }}>
            <div style={{ padding: '16px 16px 0' }}>
              <Input value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索名称、标识或备注" prefix={<Search size={16} />} allowClear />
            </div>
            <Table<DictType> rowKey="id" columns={typeColumns} dataSource={filteredTypes} loading={loading}
              size="middle" pagination={{ current: currentPage, pageSize, total: filteredTotal,
                showSizeChanger: true, pageSizeOptions: [10, 20, 50],
                showTotal: (total) => `共 ${total} 条`, onChange: changePage }}
              onRow={(type) => ({ onClick: () => setSelectedId(type.id),
                style: { cursor: 'pointer', background: selectedId === type.id ? '#eff6ff' : undefined } })} />
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16 }}
            title={selectedType ? <Space><span>{selectedType.name}</span><Text code>{selectedType.code}</Text>
              <Tag color={selectedType.isPublic ? 'blue' : 'default'}>{selectedType.isPublic ? '公开' : '仅后台'}</Tag></Space> : '字典子项'}
            extra={<Button type="primary" size="small" icon={<Plus size={14} />} disabled={!selectedType}
              onClick={() => openItemEditor(null)}>新增子项</Button>}>
            {selectedType ? (
              <Table<DictItem> rowKey="id" columns={itemColumns} dataSource={selectedType.items}
                loading={loading} size="middle" pagination={{ pageSize: 10, hideOnSinglePage: true }} />
            ) : <Empty description="先新增或选择字典类型" style={{ padding: '40px 0' }} />}
          </Card>
        </Col>
      </Row>
      <DictionaryTypeEditor open={typeEditorOpen} item={editingType} saving={saving}
        onClose={() => setTypeEditorOpen(false)} onSave={saveTypes} />
      <DictionaryItemEditor open={itemEditorOpen} item={editingItem} saving={saving}
        onClose={() => setItemEditorOpen(false)}
        onSave={(inputs, id) => selectedType ? saveItems(selectedType, inputs, id) : Promise.resolve(false)} />
    </div>
  );
}
