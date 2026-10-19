import { useEffect } from 'react';
import { Form, Input, Modal, Switch } from 'antd';
import type { ConfigInput, ConfigItem } from '../../api/configs';

interface ConfigEditorProps {
  open: boolean;
  item: ConfigItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: ConfigInput, originalKey?: string) => Promise<boolean>;
}

const emptyInput: ConfigInput = { key: '', name: '', value: '', enabled: true, remark: '' };

export function ConfigEditor({ open, item, saving, onClose, onSave }: ConfigEditorProps) {
  const [form] = Form.useForm<ConfigInput>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(item ? {
      key: item.key, name: item.name, value: item.value,
      enabled: item.enabled, remark: item.remark,
    } : emptyInput);
  }, [form, item, open]);

  const submit = async (values: ConfigInput) => {
    const succeeded = await onSave({
      ...values,
      key: values.key.trim(), name: values.name.trim(),
      remark: values.remark?.trim() ?? '',
    }, item?.key);
    if (succeeded) onClose();
  };

  return (
    <Modal
      title={item ? '编辑配置' : '新增配置'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
      width={620}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={(values) => void submit(values)}>
        <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入名称' }]}>
          <Input maxLength={100} placeholder="例如：客服联系方式" />
        </Form.Item>
        <Form.Item name="key" label="键" rules={[{ required: true, whitespace: true, message: '请输入键' }]}>
          <Input maxLength={100} placeholder="例如：contact" />
        </Form.Item>
        <Form.Item name="value" label="值">
          <Input.TextArea rows={4} maxLength={65535} showCount placeholder="配置值（文本）" />
        </Form.Item>
        <Form.Item name="enabled" label="启用" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} maxLength={500} showCount placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
