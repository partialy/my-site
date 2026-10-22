import React, { useState } from 'react';
import { Form, Input, Modal, Alert, message } from 'antd';
import { Lock, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { changePassword, ApiCode } from '../api';
import { useAuth } from '../auth';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleCancel = () => {
    form.resetFields();
    setErrorMsg(null);
    onClose();
  };

  const handleFinish = async (values: FormValues) => {
    setErrorMsg(null);

    // 前端校验：新旧密码不同
    if (values.newPassword === values.oldPassword) {
      form.setFields([
        {
          name: 'newPassword',
          errors: ['新密码不能与原密码相同'],
        },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (res.success) {
        message.success('密码修改成功，当前会话已失效，请重新登录');
        handleCancel();
        logout();
        navigate('/login', { replace: true });
        return;
      }

      // 处理原密码错误 (1008)
      if (res.code === ApiCode.INVALID_OLD_PASSWORD) {
        form.setFields([
          {
            name: 'oldPassword',
            errors: [res.msg || '原密码错误'],
          },
        ]);
        return;
      }

      // 处理参数校验错误 (1001)
      if (res.code === ApiCode.VALIDATION_ERROR && res.data?.fieldErrors) {
        const fieldErrors = res.data.fieldErrors;
        const fields = Object.entries(fieldErrors).map(([name, errors]) => ({
          name: name as keyof FormValues,
          errors,
        }));
        form.setFields(fields);
        return;
      }

      // 其他错误
      setErrorMsg(res.msg || '修改密码失败，请稍后重试');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络或服务异常');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={18} style={{ color: '#2563eb' }} />
          <span>修改密码</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="确认修改"
      cancelText="取消"
      destroyOnClose
      centered
      maskClosable={!submitting}
    >
      <div style={{ paddingTop: 12 }}>
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
          onFinish={handleFinish}
          requiredMark="optional"
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[
              { required: true, message: '请输入原密码' },
              { min: 8, max: 128, message: '密码长度在 8–128 位之间' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入当前使用的原密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, max: 128, message: '新密码长度必须在 8–128 位之间' },
            ]}
            extra="密码长度 8–128 位，且不能与原密码相同"
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入新密码（8–128 位）"
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
              placeholder="请再次输入新密码以确认"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
