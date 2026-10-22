import { useEffect, useMemo, useState } from 'react';
import { Input, Modal, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { Search } from 'lucide-react';
import type { DictType } from '../../api/dictionaries';

interface Props {
  open: boolean;
  types: DictType[];
  selectedIds: string[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}

const columns: TableProps<DictType>['columns'] = [
  { title: '类型名称', dataIndex: 'name', key: 'name' },
  { title: '标识', dataIndex: 'code', key: 'code', render: (code: string) => <Typography.Text code>{code}</Typography.Text> },
  { title: '子项', key: 'items', width: 90, render: (_, type) => type.items.length },
  { title: '状态', key: 'enabled', width: 80, render: (_, type) =>
    <Tag color={type.enabled ? 'success' : 'default'}>{type.enabled ? '启用' : '停用'}</Tag> },
];

export function DictionaryTypePickerModal({ open, types, selectedIds, onCancel, onConfirm }: Props) {
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    setDraftIds(selectedIds);
    setSearch('');
    setPage(1);
  }, [open, selectedIds]);

  const filteredTypes = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return keyword ? types.filter((type) => [type.name, type.code, type.remark]
      .some((value) => value.toLocaleLowerCase().includes(keyword))) : types;
  }, [search, types]);

  return <Modal title="选择字典类型" open={open} onCancel={onCancel}
    onOk={() => onConfirm(draftIds)} okText={`添加所选（${draftIds.length}）`} width={760} destroyOnHidden>
    <Space direction="vertical" size={14} style={{ width: '100%', marginTop: 12 }}>
      <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        placeholder="搜索名称、标识或备注" prefix={<Search size={16} />} allowClear />
      <Table<DictType> rowKey="uuid" columns={columns} dataSource={filteredTypes} size="middle"
        rowSelection={{ selectedRowKeys: draftIds, preserveSelectedRowKeys: true,
          onChange: (keys) => setDraftIds(keys.filter((key): key is string => typeof key === 'string')) }}
        pagination={{ current: page, pageSize: 10, total: filteredTypes.length,
          showTotal: (total) => `共 ${total} 条`, onChange: setPage }} />
    </Space>
  </Modal>;
}
