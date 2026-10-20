import { useEffect } from 'react';
import { Form, Input, Modal, Switch } from 'antd';
import type { CreateDictTypeInput, DictType } from '../../api/dictionaries';

interface Props {
  open: boolean;
  item: DictType | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateDictTypeInput, item?: DictType) => Promise<boolean>;
}

const blank: CreateDictTypeInput = { code: '', name: '', remark: '', isPublic: false, enabled: true };

export function DictionaryTypeEditor({ open, item, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm<CreateDictTypeInput>();

  useEffect(() => {
    if (open) form.setFieldsValue(item ? {
      code: item.code, name: item.name, remark: item.remark,
      isPublic: item.isPublic, enabled: item.enabled,
    } : blank);
  }, [form, item, open]);

  const submit = async (values: CreateDictTypeInput) => {
    const succeeded = await onSave({
      code: values.code.trim(), name: values.name.trim(), remark: values.remark?.trim() ?? '',
      isPublic: values.isPublic, enabled: values.enabled,
    }, item ?? undefined);
    if (succeeded) onClose();
  };

  return (
    <Modal title={item ? '编辑字典类型' : '新增字典类型'} open={open} onCancel={onClose}
      onOk={() => form.submit()} okText="保存" cancelText="取消" confirmLoading={saving}
      destroyOnHidden width={580}>
      <Form form={form} layout="vertical" onFinish={(values) => void submit(values)} style={{ marginTop: 24 }}>
        <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入名称' }]}>
          <Input maxLength={100} placeholder="例如：订单状态" />
        </Form.Item>
        <Form.Item name="code" label="标识" extra="创建后不可修改，供代码中的 dict 属性引用"
          rules={[{ required: true, message: '请输入标识' },
            { pattern: /^[A-Za-z][A-Za-z0-9_-]*$/, message: '以字母开头，仅支持字母、数字、下划线和连字符' }]}>
          <Input maxLength={80} disabled={Boolean(item)} placeholder="例如：order_status" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={500} showCount placeholder="可选" />
        </Form.Item>
        <Form.Item name="isPublic" label="公开给用户端" valuePropName="checked"
          extra="开启后，用户端可通过公共接口获取启用的子项">
          <Switch checkedChildren="公开" unCheckedChildren="仅后台" />
        </Form.Item>
        <Form.Item name="enabled" label="启用" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
