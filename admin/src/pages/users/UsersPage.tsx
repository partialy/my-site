import { useMemo, useState } from 'react';
import { Alert, App, Avatar, Button, Card, Descriptions, Flex, Modal, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { RefreshCw, UserPlus, UserRound, UsersRound } from 'lucide-react';
import type { UserItem, UserStatus } from '../../api/users';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { CrudRowActions, type CrudRowAction } from '../../components/crud/CrudRowActions';
import { formatDateTime } from '../../utils/dateTime';
import { useUsers, type UserFilters } from './useUsers';
import { UserRegisterModal } from './UserRegisterModal';
import { UserProfileModal } from './UserProfileModal';

const { Title, Paragraph, Text } = Typography;

const filterFields: ReadonlyArray<CrudFilterField<UserFilters>> = [
  { key: 'search', kind: 'text', placeholder: '搜索账号或昵称', width: 280 },
  { key: 'status', kind: 'select', placeholder: '全部状态', width: 160,
    options: [{ label: '正常', value: 'active' }, { label: '已禁用', value: 'disabled' }] },
];

export function UsersPage() {
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { message } = App.useApp();
  const { query, result, loading, error, reload, setFilters, resetFilters, setPage,
    register, updateStatus, updateProfile } = useUsers();

  const columns = useMemo<TableColumnsType<UserItem>>(() => [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: '账号', dataIndex: 'account', render: (value: string) => <Text strong>{value}</Text> },
    { title: '昵称', key: 'nickname', render: (_, item) => <Space size={10}>
      <Avatar src={item.avatar || undefined} icon={<UserRound size={16} />} />
      <Text>{item.nickname}</Text>
    </Space> },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (value: UserStatus) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '正常' : '已禁用'}</Tag> },
    { title: '注册时间', dataIndex: 'createdAt', width: 190, render: formatDateTime },
    { title: '操作', key: 'actions', width: 180,
      render: (_, item) => {
        const nextStatus: UserStatus = item.status === 'active' ? 'disabled' : 'active';
        const actions: CrudRowAction<UserItem>[] = [
          { key: 'detail', label: '详情', onClick: setSelected },
          { key: 'edit', label: '编辑', onClick: setEditing },
          { key: 'status', label: nextStatus === 'disabled' ? '禁用' : '启用', danger: nextStatus === 'disabled',
            confirm: {
              title: nextStatus === 'disabled' ? '禁用用户' : '启用用户',
              description: nextStatus === 'disabled' ? `禁用 ${item.account} 后，其现有登录凭证会失效。` : `确认启用 ${item.account}？`,
              okText: nextStatus === 'disabled' ? '确认禁用' : '确认启用',
            },
            onClick: async (user) => {
              const updated = await updateStatus(user.id, nextStatus);
              setSelected((current) => current?.id === user.id ? updated.item : current);
              message.success(updated.message);
            } },
        ];
        return <CrudRowActions item={item} actions={actions} />;
      } },
  ], [updateStatus, message]);

  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><UsersRound size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>业务用户</Text></Space>
        <Title level={2} style={{ margin: 0 }}>用户管理</Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>注册业务用户、查看用户并管理账号状态。</Paragraph>
      </div>
      <Space>
        <Button icon={<RefreshCw size={16} />} loading={loading} onClick={reload}>刷新</Button>
        <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setRegisterOpen(true)}>注册用户</Button>
      </Space>
    </Flex>
    <CrudFilterBar fields={filterFields} values={query} defaultValues={{}} onSearch={setFilters} onReset={resetFilters} />
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Table<UserItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
        pagination={{ current: query.page, pageSize: query.pageSize, total: result.total,
          showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 位用户`,
          onChange: setPage }} />
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
    <UserRegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)}
      onRegister={async (input) => {
        const result = await register(input);
        message.success(result);
      }} />
    <UserProfileModal user={editing} onClose={() => setEditing(null)}
      onSave={async (id, input) => {
        const updated = await updateProfile(id, input);
        setSelected((current) => current?.id === id ? updated.item : current);
        message.success(updated.message);
      }} />
  </div>;
}
