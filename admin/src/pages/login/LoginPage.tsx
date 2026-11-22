import React, { useState } from 'react';
import { Form, Input, Button, Alert, message } from 'antd';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiCode } from '../../api';
import { useAuth } from '../../auth';
import { SiteIcon } from '../../components/SiteIcon';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';
import { loginBackgroundStyle, loginCardStyle } from '../../site-settings/loginAppearance';
import type { LoginRequest } from '../../api/types';
import { ResetPasswordModal } from './ResetPasswordModal';

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginRequest>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = useSiteSettings();

  const handleFinish = async (values: LoginRequest) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await login({
        username: values.username.trim(),
        password: values.password,
      });

      if (res.success) {
        message.success('登录成功');
        navigate('/', { replace: true });
        return;
      }

      // 登录失败 1004: 留在登录页展示错误，不触发全局跳转
      if (res.code === ApiCode.INVALID_CREDENTIALS) {
        setErrorMsg('账号或密码错误，请重新输入');
        return;
      }

      // 参数校验错误 1001
      if (res.code === ApiCode.VALIDATION_ERROR && res.data?.fieldErrors) {
        const fieldErrors = res.data.fieldErrors;
        const fields = Object.entries(fieldErrors).map(([name, errors]) => ({
          name: name as keyof LoginRequest,
          errors,
        }));
        form.setFields(fields);
        return;
      }

      setErrorMsg(res.msg || '登录失败，请稍后重试');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络连接失败，请检查服务状态');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper login-auth-page" style={loginBackgroundStyle(settings.loginAppearance)}>
      <div className="auth-card" style={loginCardStyle(settings.loginAppearance)}>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <SiteIcon url={settings.admin.iconUrl} size={28} />
          </div>
          <h1 className="auth-title">{settings.admin.systemName}登录</h1>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Form.Item
            label="管理员账号"
            name="username"
            rules={[{ required: true, message: '请输入管理员账号' }]}
          >
            <Input
              prefix={<User size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入管理员用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="登录密码"
            name="password"
            rules={[{ required: true, message: '请输入登录密码' }]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入登录密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 28, marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="link" size="small" onClick={() => setResetOpen(true)}>
            忘记密码？使用 Setup Key 重置
          </Button>
        </div>
      </div>

      <ResetPasswordModal open={resetOpen} onCancel={() => setResetOpen(false)} />
    </div>
  );
};
