import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { RefreshCw, Search, UsersRound } from 'lucide-react';
import type { UserItem, UserQuery, UserStatus } from '../../api/users';
import { formatDateTime } from '../../utils/dateTime';
import { useUsers } from './useUsers';

const { Title, Paragraph, Text } = Typography;

export function UsersPage() {
  const [query, setQuery] = useState<UserQuery>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [selected, setSelected] = useState<UserItem | null>(null);
  const { result, loading, savingId, error, reload, updateStatus } = useUsers(query);
  const [messageApi, contextHolder] = message.useMessage();

  const applyFilter = () => setQuery((current) => ({ ...current, page: 1, search: search.trim() || undefined, status }));
  const reset = () => {
    setSearch('');
    setStatus(undefined);
    setQuery((current) => ({ page: 1, pageSize: current.pageSize }));
  };
  const changeStatus = (item: UserItem) => {
    const target: UserStatus = item.status === 'active' ? 'disabled' : 'active';
    Modal.confirm({
      title: target === 'disabled' ? '禁用用户' : '启用用户',
      content: target === 'disabled' ? `禁用 ${item.account} 后，其现有登录凭证会失效。` : `确认启用 ${item.account}？`,
      okText: target === 'disabled' ? '确认禁用' : '确认启用',
      okButtonProps: target === 'disabled' ? { danger: true } : undefined,
      cancelText: '取消',
      async onOk() {
        try {
          const msg = await updateStatus(item.id, target);
          if (selected?.id === item.id) setSelected({ ...item, status: target });
          messageApi.success(msg);
        } catch (cause) {
          messageApi.error(cause instanceof Error ? cause.message : '操作失败');
          throw cause;
        }
      },
    });
  };

  const columns = useMemo<TableColumnsType<UserItem>>(() => [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '账号', dataIndex: 'account', render: (value: string) => <Text strong>{value}</Text> },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (value: UserStatus) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '正常' : '已禁用'}</Tag> },
    { title: '注册时间', dataIndex: 'createdAt', width: 190, render: (value: string) => formatDateTime(value) },
    { title: '操作', key: 'actions', width: 180,
      render: (_, item) => <Space size={0}>
        <Button type="link" size="small" onClick={() => setSelected(item)}>详情</Button>
        <Button type="link" size="small" danger={item.status === 'active'} loading={savingId === item.id}
          onClick={() => changeStatus(item)}>{item.status === 'active' ? '禁用' : '启用'}</Button>
      </Space> },
  ], [savingId, selected]);

  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    {contextHolder}
    <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><UsersRound size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>业务用户</Text></Space>
        <Title level={2} style={{ margin: 0 }}>用户管理</Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>查看注册用户并管理账号状态。</Paragraph>
      </div>
      <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void reload()}>刷新</Button>
    </Flex>
    <Card style={{ marginBottom: 16, borderRadius: 16 }}>
      <Flex wrap="wrap" gap={12} align="center">
        <Input placeholder="搜索账号或昵称" value={search} onChange={(event) => setSearch(event.target.value)}
          onPressEnter={applyFilter} allowClear style={{ width: 280 }} />
        <Select placeholder="全部状态" value={status} onChange={setStatus} allowClear style={{ width: 160 }}
          options={[{ label: '正常', value: 'active' }, { label: '已禁用', value: 'disabled' }]} />
        <Button type="primary" icon={<Search size={16} />} onClick={applyFilter}>查询</Button>
        <Button onClick={reset}>重置</Button>
      </Flex>
    </Card>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Table<UserItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
        pagination={{ current: query.page, pageSize: query.pageSize, total: result.total,
          showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 位用户`,
          onChange: (page, pageSize) => setQuery((current) => ({ ...current, page, pageSize })) }} />
    </Card>
    <Modal title="用户详情" open={selected !== null} footer={null} onCancel={() => setSelected(null)} width={620} destroyOnHidden>
      {selected && <Descriptions column={1} bordered size="small" styles={{ label: { width: 120 } }}>
        <Descriptions.Item label="用户 ID">{selected.id}</Descriptions.Item>
        <Descriptions.Item label="账号">{selected.account}</Descriptions.Item>
        <Descriptions.Item label="昵称">{selected.nickname}</Descriptions.Item>
        <Descriptions.Item label="头像">{selected.avatar ? <a href={selected.avatar} target="_blank" rel="noreferrer">查看头像</a> : '—'}</Descriptions.Item>
        <Descriptions.Item label="状态">{selected.status === 'active' ? '正常' : '已禁用'}</Descriptions.Item>
        <Descriptions.Item label="注册时间">{formatDateTime(selected.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
      </Descriptions>}
    </Modal>
  </div>;
}
