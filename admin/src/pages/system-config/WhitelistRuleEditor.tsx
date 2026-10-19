import { useEffect, useState } from 'react';
import { Alert, Form, Input, Modal, Radio } from 'antd';
import { ApiCode, createWhitelistRule, updateWhitelistRule } from '../../api';
import type { WhitelistRule, WhitelistRuleInput } from '../../api/systemConfig';

interface Props {
  open: boolean;
  rule: WhitelistRule | null;
  onClose: () => void;
  onSaved: () => void;
}

export function WhitelistRuleEditor({ open, rule, onClose, onSaved }: Props) {
  const [form] = Form.useForm<WhitelistRuleInput>();
  const type = Form.useWatch('type', form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(rule ? {
      name: rule.name,
      type: rule.type,
      path: rule.path,
      remark: rule.remark,
    } : { name: '', type: 'exact', path: '', remark: '' });
    setError(null);
  }, [form, open, rule]);

  const submit = async (values: WhitelistRuleInput) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: values.name?.trim() || undefined,
        type: values.type,
        path: values.path.trim(),
        remark: values.remark?.trim() || '',
      };
      const result = rule
        ? await updateWhitelistRule(rule.id, payload)
        : await createWhitelistRule(payload);
      if (result.success) {
        onSaved();
        onClose();
      } else if (result.code === ApiCode.VALIDATION_ERROR && result.data?.fieldErrors) {
        const fieldNames: (keyof WhitelistRuleInput)[] = ['name', 'type', 'path', 'remark'];
        form.setFields(Object.entries(result.data.fieldErrors)
          .filter(([name]) => fieldNames.includes(name as keyof WhitelistRuleInput))
          .map(([name, errors]) => ({ name: name as keyof WhitelistRuleInput, errors })));
      } else {
        setError(result.msg);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存白名单规则失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={rule ? '编辑白名单规则' : '新增白名单规则'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="保存规则"
      cancelText="取消"
      destroyOnClose
      maskClosable={!saving}
    >
      {error && <Alert type="error" showIcon message={error} style={{ margin: '16px 0' }} />}
      <Form form={form} layout="vertical" onFinish={submit} style={{ marginTop: 20 }}>
        <Form.Item name="name" label="名称" extra="留空时由服务端生成 8 位 ID">
          <Input maxLength={80} placeholder="例如：用户模块" />
        </Form.Item>
        <Form.Item name="type" label="匹配类型" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid" options={[
            { label: '精准匹配', value: 'exact' },
            { label: '通配匹配', value: 'wildcard' },
          ]} />
        </Form.Item>
        <Form.Item
          name="path"
          label="接口路径"
          dependencies={['type']}
          rules={[
            { required: true, message: '请输入接口路径' },
            { validator: (_, value: string) => {
              if (typeof value !== 'string' || !value.startsWith('/api/v1/')) {
                return Promise.reject(new Error('路径需以 /api/v1/ 开头'));
              }
              if (type === 'wildcard' && !value.endsWith('/**')) {
                return Promise.reject(new Error('通配路径需以 /** 结尾'));
              }
              if (type === 'exact' && value.includes('*')) {
                return Promise.reject(new Error('精准路径不能包含通配符'));
              }
              return Promise.resolve();
            } },
          ]}
        >
          <Input placeholder={type === 'wildcard' ? '/api/v1/user/**' : '/api/v1/user/info'} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} maxLength={300} showCount placeholder="描述记录此类请求的用途" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
