import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { createWhitelistRule, deleteWhitelistRule, getWhitelistRules } from '../../api/systemConfig';
import type { WhitelistRule } from '../../api/systemConfig';
import { RequestLogEndpointPicker } from './RequestLogEndpointPicker';
import type { RequestLogEndpoint } from './requestLogEndpoints';
import { WhitelistRuleEditor } from './WhitelistRuleEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function WhitelistModal({ open, onClose, onChanged }: Props) {
  const [rules, setRules] = useState<WhitelistRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WhitelistRule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWhitelistRules();
      if (result.success) setRules(result.data);
      else setError(result.msg);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '读取白名单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) void reload(); }, [open, reload]);

  const handleSaved = () => {
    message.success(editing ? '白名单规则已更新' : '白名单规则已添加');
    void reload();
    onChanged();
  };

  const handleAddFromEndpoints = async (endpoints: RequestLogEndpoint[]) => {
    const existingPaths = new Set(rules.filter((rule) => rule.type === 'exact').map((rule) => rule.path));
    let added = 0;
    try {
      for (const endpoint of endpoints) {
        if (existingPaths.has(endpoint.path)) continue;
        const result = await createWhitelistRule({
          name: endpoint.title,
          type: 'exact',
          path: endpoint.path,
          remark: `从接口目录选择：${endpoint.module}`,
        });
        if (!result.success) throw new Error(`${endpoint.path}：${result.msg}`);
        existingPaths.add(endpoint.path);
        added += 1;
      }
    } finally {
      if (added) {
        await reload();
        onChanged();
        message.success(`已添加 ${added} 条精准匹配规则`);
      }
    }
  };

  const handleDelete = (rule: WhitelistRule) => {
    Modal.confirm({
      title: `删除规则“${rule.name}”？`,
      content: '删除后，该路径将不再属于日志记录白名单。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await deleteWhitelistRule(rule.id);
          if (!result.success) throw new Error(result.msg);
          message.success('白名单规则已删除');
          await reload();
          onChanged();
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '删除失败');
        }
      },
    });
  };

  const columns: TableColumnsType<WhitelistRule> = [
    { title: '名称', dataIndex: 'name', width: 140, render: (value: string) => <Typography.Text strong>{value}</Typography.Text> },
    {
      title: '类型', dataIndex: 'type', width: 110, render: (value: WhitelistRule['type']) =>
        <Tag color={value === 'wildcard' ? 'blue' : 'green'}>{value === 'wildcard' ? '通配' : '精准'}</Tag>
    },
    { title: '路径', dataIndex: 'path', width: 230, render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (value: string) => value || '—' },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170, render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'actions', width: 140, fixed: 'right', render: (_, rule) => (
        <Space size={2}>
          <Button type="link" size="small" icon={<Pencil size={14} />} onClick={() => { setEditing(rule); setEditorOpen(true); }}>编辑</Button>
          <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => handleDelete(rule)}>删除</Button>
        </Space>
      )
    },
  ];

  return (
    <>
      <Modal
        title="请求日志白名单"
        open={open}
        onCancel={onClose}
        footer={<Button onClick={onClose}>关闭</Button>}
        width={1080}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ margin: '12px 0 18px' }}>
          日志记录模式为“白名单”时，仅匹配下列路径的 /api/v1 请求会写入 SQLite。
        </Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void reload()}>重试</Button>} style={{ marginBottom: 16 }} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
          <Button icon={<ListChecks size={16} />} onClick={() => setPickerOpen(true)}>从接口选择</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => { setEditing(null); setEditorOpen(true); }}>添加规则</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rules}
          loading={loading}
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          locale={{ emptyText: '暂无规则，点击右上角添加' }}
        />
      </Modal>
      <WhitelistRuleEditor
        open={editorOpen}
        rule={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />
      <RequestLogEndpointPicker
        open={pickerOpen}
        existingPaths={new Set(rules.filter((rule) => rule.type === 'exact').map((rule) => rule.path))}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddFromEndpoints}
      />
    </>
  );
}
