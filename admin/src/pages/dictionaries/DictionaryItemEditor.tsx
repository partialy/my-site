import { useEffect } from 'react';
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Tag, Typography } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { DICT_COLORS } from '../../api/dictionaries';
import type { CreateDictItemInput, DictItem } from '../../api/dictionaries';

interface Props {
  open: boolean;
  item: DictItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (inputs: CreateDictItemInput[], itemId?: number) => Promise<boolean>;
}

interface FormValues { entries: CreateDictItemInput[] }
const blank = (): CreateDictItemInput => ({ label: '', value: '', sort: 0, enabled: true, color: 'default' });
const colorOptions = DICT_COLORS.map((color) => ({
  value: color, label: <Tag color={color === 'default' ? undefined : color}>{color}</Tag>,
}));
const { Text } = Typography;

export function DictionaryItemEditor({ open, item, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ entries: [item ? {
      label: item.label, value: item.value, sort: item.sort,
      enabled: item.enabled, color: item.color,
    } : blank()] });
  }, [form, item, open]);

  const submit = async ({ entries }: FormValues) => {
    const inputs = entries.map((entry) => ({
      label: entry.label.trim(), value: entry.value.trim(), sort: entry.sort ?? 0,
      enabled: entry.enabled, color: entry.color,
    }));
    if (await onSave(inputs, item?.id)) onClose();
  };

  return (
    <Modal title={item ? '编辑字典子项' : '批量新增字典子项'} open={open} onCancel={onClose}
      onOk={() => form.submit()} okText={item ? '保存' : '批量保存'} cancelText="取消"
      confirmLoading={saving} destroyOnHidden width={860}
      styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}>
      <Form form={form} layout="vertical" initialValues={{ entries: [blank()] }}
        onFinish={(values) => void submit(values)} style={{ marginTop: 24 }}>
        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <div key={field.key} style={{ borderBottom: index === fields.length - 1 ? 'none' : '1px solid #edf0f5', marginBottom: 18 }}>
                  {!item && <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text strong>子项 {index + 1}</Text>
                    <Button type="text" danger size="small" icon={<Trash2 size={14} />}
                      disabled={fields.length === 1} onClick={() => remove(field.name)}>移除</Button>
                  </Space>}
                  <Row gutter={16}>
                    <Col xs={24} sm={9}>
                      <Form.Item name={[field.name, 'label']} label="显示名称"
                        rules={[{ required: true, whitespace: true, message: '请输入显示名称' }]}>
                        <Input maxLength={100} placeholder="例如：已支付" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={9}>
                      <Form.Item name={[field.name, 'value']} label="值"
                        rules={[{ required: true, message: '请输入值' },
                          { pattern: /^[A-Za-z0-9][A-Za-z0-9_-]*$/, message: '仅支持字母、数字、下划线和连字符' }]}>
                        <Input maxLength={80} disabled={Boolean(item)} placeholder="例如：paid 或 1" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item name={[field.name, 'sort']} label="排序"
                        rules={[{ required: true, message: '请输入排序值' }]}>
                        <InputNumber min={0} max={1_000_000} precision={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name={[field.name, 'color']} label="徽章颜色">
                        <Select options={colorOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name={[field.name, 'enabled']} label="启用" valuePropName="checked">
                        <Switch checkedChildren="启用" unCheckedChildren="停用" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              {!item && <Button type="dashed" block icon={<Plus size={16} />} disabled={fields.length >= 20}
                onClick={() => add(blank())}>再添加一个子项（最多 20 个）</Button>}
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
