import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, Select, Switch, Tag } from 'antd';
import { DICT_COLORS } from '../../api/dictionaries';
import type { CreateDictItemInput, DictItem } from '../../api/dictionaries';

interface Props {
  open: boolean;
  item: DictItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateDictItemInput, itemId?: number) => Promise<boolean>;
}

const blank: CreateDictItemInput = { label: '', value: '', sort: 0, enabled: true, color: 'default' };

export function DictionaryItemEditor({ open, item, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm<CreateDictItemInput>();

  useEffect(() => {
    if (open) form.setFieldsValue(item ? {
      label: item.label, value: item.value, sort: item.sort,
      enabled: item.enabled, color: item.color,
    } : blank);
  }, [form, item, open]);

  const submit = async (values: CreateDictItemInput) => {
    const succeeded = await onSave({
      label: values.label.trim(), value: values.value.trim(), sort: values.sort ?? 0,
      enabled: values.enabled, color: values.color,
    }, item?.id);
    if (succeeded) onClose();
  };

  return (
    <Modal title={item ? '编辑字典子项' : '新增字典子项'} open={open} onCancel={onClose}
      onOk={() => form.submit()} okText="保存" cancelText="取消" confirmLoading={saving}
      destroyOnHidden width={580}>
      <Form form={form} layout="vertical" onFinish={(values) => void submit(values)} style={{ marginTop: 24 }}>
        <Form.Item name="label" label="显示名称" rules={[{ required: true, whitespace: true, message: '请输入显示名称' }]}>
          <Input maxLength={100} placeholder="例如：已支付" />
        </Form.Item>
        <Form.Item name="value" label="值" extra="创建后不可修改，业务数据应保存此值"
          rules={[{ required: true, message: '请输入值' },
            { pattern: /^[A-Za-z0-9][A-Za-z0-9_-]*$/, message: '仅支持字母、数字、下划线和连字符' }]}>
          <Input maxLength={80} disabled={Boolean(item)} placeholder="例如：paid 或 1" />
        </Form.Item>
        <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序值' }]}>
          <InputNumber min={0} max={1_000_000} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="color" label="徽章颜色">
          <Select options={DICT_COLORS.map((color) => ({ value: color, label: <Tag color={color === 'default' ? undefined : color}>{color}</Tag> }))} />
        </Form.Item>
        <Form.Item name="enabled" label="启用" valuePropName="checked"
          extra="停用后不会出现在选择器中，历史数据仍保留原值">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
