import { useMemo, useState } from 'react';
import { Alert, Input, Modal, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { Search } from 'lucide-react';
import { REQUEST_LOG_ENDPOINTS } from './requestLogEndpoints';
import type { RequestLogEndpoint } from './requestLogEndpoints';

interface Props {
  open: boolean;
  existingPaths: ReadonlySet<string>;
  onClose: () => void;
  onAdd: (endpoints: RequestLogEndpoint[]) => Promise<void>;
}

export function RequestLogEndpointPicker({ open, existingPaths, onClose, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? REQUEST_LOG_ENDPOINTS.filter((item) =>
      [item.path, item.title, item.module, item.audience, ...item.methods]
        .some((value) => value.toLowerCase().includes(term))) : REQUEST_LOG_ENDPOINTS;
  }, [search]);

  const close = (force = false) => {
    if (saving && !force) return;
    setSearch('');
    setSelectedPaths([]);
    setError(null);
    onClose();
  };

  const submit = async () => {
    const selected = REQUEST_LOG_ENDPOINTS.filter((item) =>
      selectedPaths.includes(item.path) && !existingPaths.has(item.path));
    if (!selected.length) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(selected);
      close(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '添加接口失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<RequestLogEndpoint> = [
    { title: '接口', key: 'endpoint', render: (_, item) => <>
      <Typography.Text strong>{item.title}</Typography.Text>
      <div><Typography.Text code copyable={{ text: item.path }}>{item.path}</Typography.Text></div>
    </> },
    { title: '方法', dataIndex: 'methods', width: 150, render: (methods: string[]) =>
      methods.map((method) => <Tag key={method}>{method}</Tag>) },
    { title: '模块', dataIndex: 'module', width: 150 },
    { title: '端', dataIndex: 'audience', width: 120, render: (value: RequestLogEndpoint['audience']) =>
      value === 'admin' ? '管理端' : '公共端' },
    { title: '状态', key: 'status', width: 90, render: (_, item) =>
      existingPaths.has(item.path) ? <Tag>已添加</Tag> : null },
  ];

  return <Modal
    title="从接口选择"
    open={open}
    onCancel={() => close()}
    onOk={() => void submit()}
    okText={`添加选中接口（${selectedPaths.filter((path) => !existingPaths.has(path)).length}）`}
    okButtonProps={{ disabled: !selectedPaths.some((path) => !existingPaths.has(path)) }}
    cancelButtonProps={{ disabled: saving }}
    confirmLoading={saving}
    maskClosable={!saving}
    width={980}
    destroyOnClose
  >
    <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
      每个路径添加一条精准匹配规则；同一路径的多个请求方法共用该规则。动态路径及不写入请求日志的接口不在列表中。
    </Typography.Paragraph>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
    <Input prefix={<Search size={16} />} placeholder="搜索路径、接口名称或模块" allowClear
      value={search} onChange={(event) => setSearch(event.target.value)} style={{ marginBottom: 14 }} />
    <Table
      rowKey="path"
      columns={columns}
      dataSource={filtered}
      size="small"
      scroll={{ x: 'max-content', y: 440 }}
      pagination={{ pageSize: 8, showSizeChanger: false }}
      rowSelection={{ selectedRowKeys: selectedPaths, preserveSelectedRowKeys: true,
        onChange: (keys) => setSelectedPaths(keys.map(String)),
        getCheckboxProps: (item) => ({ disabled: existingPaths.has(item.path) }) }}
    />
  </Modal>;
}
