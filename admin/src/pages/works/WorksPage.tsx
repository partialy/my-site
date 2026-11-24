import { useMemo, useState } from 'react';
import {
  Alert, Button, Card, Flex, Image, message, Space, Switch, Table, Tag, Typography,
} from 'antd';
import type { TableProps } from 'antd';
import { ArrowDown, ArrowUp, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deleteAdminWork, reorderAdminWorks, updateAdminWork,
  type WorkItem, type WorkPayload,
} from '../../api/works';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { CrudRowActions, type CrudRowAction } from '../../components/crud/CrudRowActions';
import { DictTag, useDictionary } from '../../dictionaries';
import { formatDateTime } from '../../utils/dateTime';
import { defaultWorkFilters, useWorksPage, type WorkFilters } from './useWorksPage';
import { WorkEditorModal } from './WorkEditorModal';

const { Title, Text, Paragraph } = Typography;

function workToPayload(item: WorkItem, overrides: Partial<WorkPayload>): WorkPayload {
  return {
    slug: item.slug,
    name: item.name,
    enName: item.enName,
    shortTitle: item.shortTitle,
    tagline: item.tagline,
    summary: item.summary,
    category: item.category,
    year: item.year,
    version: item.version,
    license: item.license,
    platforms: item.platforms,
    accentHex: item.accentHex,
    iconKey: item.iconKey,
    iconImage: item.iconImage,
    iconFileId: item.iconFileId,
    heroImage: item.heroImage,
    heroFileId: item.heroFileId,
    heroAlt: item.heroAlt,
    githubUrl: item.links.github,
    giteeUrl: item.links.gitee,
    websiteUrl: item.links.website,
    installCommand: item.installCommand,
    metrics: item.metrics,
    highlights: item.highlights,
    techStack: item.techStack,
    releases: item.releases,
    detailIntro: item.detailIntro,
    detailArchitecture: item.detailArchitecture,
    featuredHome: item.featuredHome,
    status: item.status,
    sortOrder: item.sortOrder,
    ...overrides,
  };
}

export function WorksPage() {
  const { query, result, loading, error, reload, replaceItem, setFilters, resetFilters, setPage } = useWorksPage();
  const { items: categoryItems } = useDictionary('work_category');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  const filterFields = useMemo<ReadonlyArray<CrudFilterField<WorkFilters>>>(() => [
    { key: 'search', kind: 'text', placeholder: '搜索名称、Slug、标语或技术栈', width: 280 },
    {
      key: 'category',
      kind: 'select',
      placeholder: '作品分类',
      width: 150,
      options: categoryItems.map((item) => ({ label: item.label, value: item.value })),
    },
    {
      key: 'status',
      kind: 'select',
      placeholder: '发布状态',
      width: 130,
      options: [
        { label: '已发布', value: 'published' },
        { label: '草稿', value: 'draft' },
      ],
    },
    {
      key: 'featuredHome',
      kind: 'select',
      placeholder: '首页轮盘',
      width: 130,
      options: [
        { label: '仅首页展示', value: 'true' },
        { label: '未上首页', value: 'false' },
      ],
    },
  ], [categoryItems]);

  const toggleStatus = async (item: WorkItem, checked: boolean) => {
    try {
      const res = await updateAdminWork(item.uuid, workToPayload(item, { status: checked ? 'published' : 'draft' }));
      if (!res.success) throw new Error(res.msg);
      replaceItem((row) => row.uuid === item.uuid, res.data);
      message.success(checked ? '作品已发布' : '已转为草稿');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '状态切换失败');
    }
  };

  const toggleFeatured = async (item: WorkItem, checked: boolean) => {
    try {
      const res = await updateAdminWork(item.uuid, workToPayload(item, { featuredHome: checked }));
      if (!res.success) throw new Error(res.msg);
      replaceItem((row) => row.uuid === item.uuid, res.data);
      message.success(checked ? '已开启首页轮盘展示' : '已从首页轮盘隐藏');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '操作失败');
    }
  };

  const moveRow = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= result.list.length) return;
    const current = result.list[index]!;
    const neighbor = result.list[targetIdx]!;
    const nextSortCurrent = neighbor.sortOrder === current.sortOrder ? current.sortOrder + direction : neighbor.sortOrder;
    const nextSortNeighbor = current.sortOrder;

    try {
      const res = await reorderAdminWorks([
        { uuid: current.uuid, sortOrder: nextSortCurrent },
        { uuid: neighbor.uuid, sortOrder: nextSortNeighbor },
      ]);
      if (!res.success) throw new Error(res.msg);
      message.success('排序已更新');
      reload();
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '排序更新失败');
    }
  };

  const rowActions: ReadonlyArray<CrudRowAction<WorkItem>> = [
    {
      key: 'edit',
      label: '编辑',
      icon: <Pencil size={14} />,
      onClick: (item) => {
        setEditingUuid(item.uuid);
        setDrawerOpen(true);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <Trash2 size={14} />,
      danger: true,
      confirm: {
        title: '确认删除该作品？',
        description: '删除后无法恢复（关联文件库图片不会被删除）。',
        okText: '确认删除',
      },
      onClick: async (item) => {
        const res = await deleteAdminWork(item.uuid);
        if (!res.success) throw new Error(res.msg);
        message.success('作品已删除');
        if (result.list.length === 1 && query.page > 1) {
          setPage(query.page - 1, query.pageSize);
        } else {
          reload();
        }
      },
    },
  ];

  const columns: TableProps<WorkItem>['columns'] = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 110,
      render: (_val, _record, idx) => (
        <Space size={4}>
          <Text style={{ minWidth: 28, display: 'inline-block' }}>{_record.sortOrder}</Text>
          <Button
            type="text"
            size="small"
            icon={<ArrowUp size={14} />}
            disabled={idx === 0}
            aria-label="上移"
            onClick={() => void moveRow(idx, -1)}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDown size={14} />}
            disabled={idx === result.list.length - 1}
            aria-label="下移"
            onClick={() => void moveRow(idx, 1)}
          />
        </Space>
      ),
    },
    {
      title: '作品信息',
      key: 'info',
      render: (_, record) => (
        <Space size={12}>
          {record.heroImage ? (
            <Image
              src={record.heroImage}
              alt={record.name}
              width={64}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
            />
          ) : (
            <div style={{ width: 64, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>
              无图
            </div>
          )}
          <div>
            <Space size={6}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: record.accentHex, display: 'inline-block' }} />
              <Text strong>{record.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.enName}</Text>
            </Space>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              /{record.slug} · {record.version} · {record.license}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      render: (value: string) => <DictTag dict="work_category" value={value} />,
    },
    {
      title: '支持平台',
      dataIndex: 'platforms',
      width: 160,
      render: (platforms: WorkItem['platforms']) => (
        <Space size={4} wrap>
          {platforms.map((p) => <Tag key={p} style={{ marginInlineEnd: 0 }}>{p}</Tag>)}
        </Space>
      ),
    },
    {
      title: '首页轮盘',
      dataIndex: 'featuredHome',
      width: 100,
      render: (val: boolean, record) => (
        <Switch size="small" checked={val} onChange={(checked) => void toggleFeatured(record, checked)} />
      ),
    },
    {
      title: '发布状态',
      dataIndex: 'status',
      width: 100,
      render: (val: WorkItem['status'], record) => (
        <Switch
          size="small"
          checked={val === 'published'}
          checkedChildren="公开"
          unCheckedChildren="草稿"
          onChange={(checked) => void toggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: string) => <Text type="secondary">{formatDateTime(value)}</Text>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => <CrudRowActions item={record} actions={rowActions} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="flex-end" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}>
            <FolderKanban size={17} />
            <Text style={{ color: '#2563eb', fontWeight: 600 }}>个人主页内容</Text>
          </Space>
          <Title level={2} style={{ margin: 0 }}>作品管理</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
            管理个人主页展厅、作品目录与档案详情；封面图片支持通过文件库上传或七牛云直传。
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingUuid(null);
            setDrawerOpen(true);
          }}
        >
          新增作品
        </Button>
      </Flex>

      <CrudFilterBar
        fields={filterFields}
        values={query}
        defaultValues={defaultWorkFilters}
        onSearch={setFilters}
        onReset={resetFilters}
      />

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

      <Card style={{ borderRadius: 16 }}>
        <Table<WorkItem>
          rowKey="uuid"
          loading={loading}
          columns={columns}
          dataSource={result.list}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total: result.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 件作品`,
            onChange: setPage,
          }}
        />
      </Card>

      <WorkEditorModal
        open={drawerOpen}
        editingUuid={editingUuid}
        onClose={() => setDrawerOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
