import React, { useState } from 'react';
import { Alert, Form, Input, Modal, message } from 'antd';
import { KeyRound, Lock } from 'lucide-react';
import { ApiCode, resetPassword } from '../../api';

interface ResetPasswordFormValues {
  setupKey: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordModalProps {
  open: boolean;
  onCancel: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ open, onCancel }) => {
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    form.resetFields();
    setErrorMsg(null);
    onCancel();
  };

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await resetPassword({
        setupKey: values.setupKey.trim(),
        newPassword: values.newPassword,
      });

      if (res.success) {
        message.success(res.msg || '密码重置成功，请使用新密码登录');
        handleClose();
        return;
      }

      if (res.code === ApiCode.INVALID_SETUP_KEY) {
        form.setFields([{ name: 'setupKey', errors: ['初始化密钥错误'] }]);
        return;
      }

      if (res.code === ApiCode.VALIDATION_ERROR && res.data?.fieldErrors) {
        const fields = Object.entries(res.data.fieldErrors).map(([name, errors]) => ({
          name: name as keyof ResetPasswordFormValues,
          errors,
        }));
        form.setFields(fields);
        return;
      }

      setErrorMsg(res.msg || '重置密码失败，请稍后重试');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络连接失败，请检查服务状态');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="重置管理员密码"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="确认重置"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
      width={440}
    >
      <div style={{ marginTop: 12 }}>
        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="初始化密钥（Setup Key）"
            name="setupKey"
            rules={[{ required: true, message: '请输入服务端配置的 SETUP_KEY' }]}
          >
            <Input.Password
              prefix={<KeyRound size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入服务端 .env 中的 SETUP_KEY"
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '新密码至少需要 8 位字符' },
              { max: 128, message: '新密码不能超过 128 位字符' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入 8–128 位新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请再次输入新密码"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
