import { useState } from 'react';
import { Alert, Form, Input, Modal } from 'antd';
import type { UserRegisterInput } from '../../api/users';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegister: (input: UserRegisterInput) => Promise<void>;
}

interface RegisterForm extends UserRegisterInput {
  confirmPassword: string;
}

export function UserRegisterModal({ open, onClose, onRegister }: Props) {
  const [form] = Form.useForm<RegisterForm>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (saving) return;
    form.resetFields();
    setError(null);
    onClose();
  };

  const submit = async (values: RegisterForm) => {
    setSaving(true);
    setError(null);
    try {
      await onRegister({
        account: values.account.trim(),
        password: values.password,
        nickname: values.nickname?.trim() || undefined,
      });
      form.resetFields();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '注册用户失败');
    } finally {
      setSaving(false);
    }
  };

  return <Modal
    title="注册用户"
    open={open}
    onCancel={close}
    onOk={() => form.submit()}
    okText="注册"
    cancelText="取消"
    confirmLoading={saving}
    cancelButtonProps={{ disabled: saving }}
    maskClosable={!saving}
    destroyOnHidden
    width={560}
  >
    {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    <Form form={form} layout="vertical" onFinish={(values) => void submit(values)} style={{ marginTop: 20 }}>
      <Form.Item name="account" label="账号" rules={[
        { required: true, message: '请输入账号' },
        { pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,31}$/, message: '3-32 位，以字母开头，只能包含字母、数字和下划线' },
      ]}>
        <Input maxLength={32} autoComplete="off" placeholder="请输入用户账号" />
      </Form.Item>
      <Form.Item name="nickname" label="昵称" rules={[{ max: 50, message: '昵称最多 50 个字符' }]}>
        <Input maxLength={50} placeholder="可选，留空时使用账号" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[
        { required: true, message: '请输入密码' },
        { min: 12, max: 128, message: '密码长度需为 12-128 位' },
      ]}>
        <Input.Password maxLength={128} autoComplete="new-password" placeholder="至少 12 位" />
      </Form.Item>
      <Form.Item name="confirmPassword" label="确认密码" dependencies={['password']} rules={[
        { required: true, message: '请再次输入密码' },
        ({ getFieldValue }) => ({ validator: (_, value: string) =>
          value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')) }),
      ]}>
        <Input.Password maxLength={128} autoComplete="new-password" placeholder="请再次输入密码" />
      </Form.Item>
    </Form>
  </Modal>;
}
