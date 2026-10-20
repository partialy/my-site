import { useEffect } from 'react';
import { Button, Col, Flex, Form, Input, Modal, Row, Space, Typography } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateDictTypeInput, DictType } from '../../api/dictionaries';
import { DictionaryFormSwitch } from './DictionaryFormSwitch';

interface Props {
  open: boolean;
  item: DictType | null;
  saving: boolean;
  onClose: () => void;
  onSave: (inputs: CreateDictTypeInput[], item?: DictType) => Promise<boolean>;
}

interface FormValues { entries: CreateDictTypeInput[] }
const blank = (): CreateDictTypeInput => ({ code: '', name: '', remark: '', isPublic: false, enabled: true });
const { Text } = Typography;

export function DictionaryTypeEditor({ open, item, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ entries: [item ? {
      code: item.code, name: item.name, remark: item.remark,
      isPublic: item.isPublic, enabled: item.enabled,
    } : blank()] });
  }, [form, item, open]);

  const submit = async ({ entries }: FormValues) => {
    const inputs = entries.map((entry) => ({
      code: entry.code.trim(), name: entry.name.trim(), remark: entry.remark?.trim() ?? '',
      isPublic: entry.isPublic, enabled: entry.enabled,
    }));
    if (await onSave(inputs, item ?? undefined)) onClose();
  };

  return (
    <Modal title={item ? '编辑字典类型' : '批量新增字典类型'} open={open} onCancel={onClose}
      onOk={() => form.submit()} okText={item ? '保存' : '批量保存'} cancelText="取消"
      confirmLoading={saving} destroyOnHidden width={780}
      styles={{ body: { maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden', paddingInline: '12px 8px' } }}>
      <Form form={form} layout="vertical" initialValues={{ entries: [blank()] }}
        onFinish={(values) => void submit(values)} style={{ marginTop: 24 }}>
        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <div key={field.key} style={{ borderBottom: index === fields.length - 1 ? 'none' : '1px solid #edf0f5', marginBottom: 18 }}>
                  <Flex align="center" justify="space-between" wrap gap={12} style={{ marginBottom: 12 }}>
                    <Text strong>{item ? '字典类型' : `类型 ${index + 1}`}</Text>
                    <Space size={12} wrap>
                      <Form.Item name={[field.name, 'isPublic']} valuePropName="checked" style={{ marginBottom: 0 }}>
                        <DictionaryFormSwitch kind="visibility" tooltip="公开后，用户端可获取此类型及其启用子项" aria-label="是否公开给用户端" />
                      </Form.Item>
                      <Form.Item name={[field.name, 'enabled']} valuePropName="checked" style={{ marginBottom: 0 }}>
                        <DictionaryFormSwitch kind="enabled" tooltip="停用后，此类型及其子项不再对外提供" aria-label="是否启用" />
                      </Form.Item>
                      {!item && <Button type="text" danger size="small" icon={<Trash2 size={14} />}
                        disabled={fields.length === 1} onClick={() => remove(field.name)}>移除</Button>}
                    </Space>
                  </Flex>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name={[field.name, 'name']} label="名称"
                        rules={[{ required: true, whitespace: true, message: '请输入名称' }]}>
                        <Input maxLength={100} placeholder="例如：订单状态" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name={[field.name, 'code']} label="标识"
                        rules={[{ required: true, message: '请输入标识' },
                          { pattern: /^[A-Za-z][A-Za-z0-9_-]*$/, message: '以字母开头，仅支持字母、数字、下划线和连字符' }]}>
                        <Input maxLength={80} disabled={Boolean(item)} placeholder="例如：order_status" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name={[field.name, 'remark']} label="备注">
                    <Input.TextArea rows={2} maxLength={500} showCount placeholder="可选" />
                  </Form.Item>
                </div>
              ))}
              {!item && <Button type="dashed" block icon={<Plus size={16} />} disabled={fields.length >= 20}
                onClick={() => add(blank())}>再添加一个类型（最多 20 个）</Button>}
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
