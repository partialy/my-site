import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, message, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import { ArrowDown, ArrowUp, Menu as MenuIcon, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import type { MenuItem } from '../../api/menus';
import { useMenus } from '../../menus/MenuContext';
import { renderMenuIcon, sortedMenus } from '../../menus/menuUtils';
import { MenuEditor } from './MenuEditor';
import { moveMenu, normalizeMenuOrder, validateMenuDraft } from './menuDraft';

const { Title, Text, Paragraph } = Typography;

function flattenForDisplay(items: MenuItem[]): MenuItem[] {
  return sortedMenus(items.filter((item) => item.parentKey === null)).flatMap((item) => [
    item, ...sortedMenus(items.filter((child) => child.parentKey === item.key)),
  ]);
}

export function MenuManagementPage() {
  const { items, loading, error, reload, save } = useMenus();
  const [draft, setDraft] = useState<MenuItem[]>(items);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!dirty) setDraft(items);
  }, [items, dirty]);

  const displayItems = useMemo(() => flattenForDisplay(draft), [draft]);
  const names = useMemo(() => new Map(draft.map((item) => [item.key, item.label])), [draft]);
  const draftError = useMemo(() => validateMenuDraft(draft), [draft]);

  const updateDraft = (next: MenuItem[]) => {
    setDraft(normalizeMenuOrder(next));
    setDirty(true);
  };

  const edit = (item: MenuItem | null) => {
    setEditing(item);
    setEditorOpen(true);
  };

  const confirmEditor = (item: MenuItem) => {
    if (!editing && draft.some((existing) => existing.key === item.key)) {
      message.error('菜单标识已存在');
      return;
    }
    if (item.type === 'route' && draft.some((existing) => existing.key !== editing?.key && existing.path === item.path)) {
      message.error('路由路径已被使用');
      return;
    }
    const siblings = draft.filter((existing) => existing.parentKey === item.parentKey);
    const next = editing
      ? draft.map((existing) => existing.key === editing.key ? { ...item, sort: existing.parentKey === item.parentKey ? existing.sort : siblings.length + 1 } : existing)
      : [...draft, { ...item, sort: siblings.length + 1 }];
    updateDraft(next);
    setEditorOpen(false);
  };

  const remove = (item: MenuItem) => {
    if (draft.some((child) => child.parentKey === item.key)) {
      message.warning('请先移走或删除该分组下的子菜单');
      return;
    }
    updateDraft(draft.filter((entry) => entry.key !== item.key));
  };

  const handleSave = async () => {
    if (draftError) {
      message.error(draftError);
      return;
    }
    setSaving(true);
    try {
      await save(normalizeMenuOrder(draft));
      setDirty(false);
      message.success('菜单已保存，侧栏已同步更新');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '保存菜单失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    setDirty(false);
    await reload();
  };

  const columns: TableProps<MenuItem>['columns'] = [
    { title: '菜单', key: 'label', width: 240, render: (_, item) => <Space style={{ paddingLeft: item.parentKey ? 26 : 0 }}>
      {renderMenuIcon(item.icon)}<Text strong={!item.parentKey}>{item.label}</Text>
    </Space> },
    { title: '标识', dataIndex: 'key', width: 180, render: (value: string) => <Text code>{value}</Text> },
    { title: '类型', dataIndex: 'type', width: 90, render: (value: MenuItem['type']) =>
      <Tag>{value === 'group' ? '分组' : value === 'route' ? '页面' : '操作'}</Tag> },
    { title: '归属', dataIndex: 'parentKey', width: 140, render: (value: string | null) => value ? names.get(value) || value : '一级菜单' },
    { title: '路径 / 操作', key: 'target', ellipsis: true, render: (_, item) => item.path || item.action || '—' },
    { title: '状态', dataIndex: 'visible', width: 90, render: (value: boolean) =>
      <Tag color={value ? 'success' : 'default'}>{value ? '显示' : '隐藏'}</Tag> },
    { title: '排序', key: 'sort', width: 110, render: (_, item) => {
      const siblings = sortedMenus(draft.filter((entry) => entry.parentKey === item.parentKey));
      const index = siblings.findIndex((entry) => entry.key === item.key);
      return <Space size={0}>
        <Button type="text" size="small" aria-label={`上移 ${item.label}`} icon={<ArrowUp size={15} />}
          disabled={index <= 0} onClick={() => updateDraft(moveMenu(draft, item.key, -1))} />
        <Button type="text" size="small" aria-label={`下移 ${item.label}`} icon={<ArrowDown size={15} />}
          disabled={index >= siblings.length - 1} onClick={() => updateDraft(moveMenu(draft, item.key, 1))} />
      </Space>;
    } },
    { title: '操作', key: 'actions', width: 145, render: (_, item) => <Space size={0}>
      <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => edit(item)}>编辑</Button>
      <Popconfirm title={`删除「${item.label}」？`} description="删除后需点击保存才会写入数据库。"
        okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => remove(item)}>
        <Button type="link" size="small" danger icon={<Trash2 size={14} />}>删除</Button>
      </Popconfirm>
    </Space> },
  ];

  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><MenuIcon size={17} />
          <Text style={{ color: '#2563eb', fontWeight: 600 }}>导航结构</Text></Space>
        <Title level={2} style={{ margin: 0 }}>菜单管理</Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>调整一级、二级菜单归属和顺序；修改后点击保存生效。</Paragraph>
      </div>
      <Space>
        <Button icon={<RefreshCw size={16} />} loading={loading} onClick={() => void handleReload()}>重新加载</Button>
        <Button icon={<Plus size={16} />} onClick={() => edit(null)}>新增菜单</Button>
        <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={!dirty || Boolean(draftError)}
          onClick={() => void handleSave()}>保存菜单</Button>
      </Space>
    </Flex>
    {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void reload()}>重试</Button>}
      style={{ marginBottom: 16 }} />}
    {draftError && <Alert type="warning" showIcon message={draftError} style={{ marginBottom: 16 }} />}
    {dirty && <Alert type="info" showIcon message="有未保存的菜单修改" style={{ marginBottom: 16 }} />}
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
      <Table<MenuItem> rowKey="key" columns={columns} dataSource={displayItems} loading={loading}
        scroll={{ x: 'max-content' }} pagination={false} />
    </Card>
    <MenuEditor open={editorOpen} editing={editing} items={draft} onClose={() => setEditorOpen(false)}
      onConfirm={confirmEditor} />
  </div>;
}
