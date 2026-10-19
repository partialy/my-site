import { Form, Input, Modal, Select, Switch } from 'antd';
import { useEffect } from 'react';
import type { MenuItem } from '../../api/menus';
import { MenuIconPicker } from './MenuIconPicker';

interface Props {
  open: boolean;
  editing: MenuItem | null;
  items: MenuItem[];
  onClose: () => void;
  onConfirm: (item: MenuItem) => void;
}

type FormValues = Omit<MenuItem, 'sort' | 'parentKey'> & { parentKey: string };
const ROOT_PARENT = '__root__';

export function MenuEditor({ open, editing, items, onClose, onConfirm }: Props) {
  const [form] = Form.useForm<FormValues>();
  const type = Form.useWatch('type', form) ?? 'route';
  const hasChildren = Boolean(editing && items.some((item) => item.parentKey === editing.key));

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing
        ? { ...editing, parentKey: editing.parentKey ?? ROOT_PARENT }
        : { key: '', label: '', type: 'route', parentKey: ROOT_PARENT, path: '', action: null,
          icon: null, visible: true });
    }
  }, [editing, form, open]);

  const confirm = async () => {
    try {
      const values = await form.validateFields();
      const next: MenuItem = {
        key: values.key.trim(), label: values.label.trim(), type: values.type,
        parentKey: values.type === 'group' || values.parentKey === ROOT_PARENT ? null : values.parentKey,
        path: values.type === 'route' ? values.path?.trim() || null : null,
        action: null,
        icon: values.icon || null, visible: values.visible,
        sort: editing?.sort ?? 0,
      };
      onConfirm(next);
    } catch {
      // 表单字段错误由 Ant Design 显示。
    }
  };

  return <Modal title={editing ? '编辑菜单' : '新增菜单'} open={open} onCancel={onClose} onOk={() => void confirm()}
    okText="确定" cancelText="取消" destroyOnHidden>
    <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
      <Form.Item name="key" label="菜单标识" rules={[{ required: true, message: '请输入菜单标识' },
        { pattern: /^[A-Za-z][A-Za-z0-9_-]*$/, message: '使用字母、数字、下划线和连字符，以字母开头' }]}>
        <Input placeholder="例如 reports" disabled={Boolean(editing)} maxLength={100} />
      </Form.Item>
      <Form.Item name="label" label="菜单名称" rules={[{ required: true, whitespace: true, message: '请输入菜单名称' }]}>
        <Input placeholder="例如报表管理" maxLength={100} />
      </Form.Item>
      <Form.Item name="type" label="菜单类型" rules={[{ required: true }]}>
        <Select disabled={hasChildren} options={[
          { label: '页面', value: 'route' }, { label: '分组', value: 'group' },
        ]} />
      </Form.Item>
      {type !== 'group' && <Form.Item name="parentKey" label="归属" rules={[{ required: true, message: '请选择归属' }]}>
        <Select options={[{ value: ROOT_PARENT, label: '一级菜单' }, ...items
          .filter((item) => item.type === 'group' && item.key !== editing?.key)
          .map((item) => ({ value: item.key, label: item.label }))]} />
      </Form.Item>}
      {type === 'route' && <Form.Item name="path" label="路由路径" rules={[{ required: true, message: '请输入路由路径' },
        { pattern: /^\/(?!\/)[^?#\\]*$/, message: '请输入不含查询参数或锚点的站内绝对路径' }]}>
        <Input placeholder="例如 /reports" maxLength={500} />
      </Form.Item>}
      <Form.Item name="icon" label="图标"><MenuIconPicker /></Form.Item>
      <Form.Item name="visible" label="侧栏显示" valuePropName="checked"><Switch /></Form.Item>
    </Form>
  </Modal>;
}
