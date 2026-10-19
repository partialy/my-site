import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  message,
  Tooltip,
} from 'antd';
import {
  User,
  Lock,
  KeyRound,
  HelpCircle,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { setupAdmin, ApiCode } from '../../api';
import { useAuth } from '../../auth';
import { SiteIcon } from '../../components/SiteIcon';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';

const { Text } = Typography;

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
  setupKey: string;
}

export const SetupPage: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { markInitialized, checkStatusAndSession } = useAuth();
  const { settings } = useSiteSettings();

  const handleFinish = async (values: FormValues) => {
    setGeneralError(null);
    setSubmitting(true);

    try {
      // 确认密码只在前端校验，不发送至服务端
      const res = await setupAdmin({
        username: values.username.trim(),
        password: values.password,
        setupKey: values.setupKey.trim(),
      });

      if (res.success) {
        message.success('系统初始化完成，请使用刚刚创建的管理员账户登录');
        markInitialized();
        navigate('/login', { replace: true });
        return;
      }

      // 处理已初始化冲突 (1003)
      if (res.code === ApiCode.ALREADY_INITIALIZED) {
        message.warning('系统已经完成初始化，正在转至登录页...');
        markInitialized();
        await checkStatusAndSession();
        navigate('/login', { replace: true });
        return;
      }

      // 处理初始化密钥错误 (1002)
      if (res.code === ApiCode.INVALID_SETUP_KEY) {
        form.setFields([
          {
            name: 'setupKey',
            errors: [res.msg || '初始化密钥错误，请核对 server 的 SETUP_KEY 环境变量'],
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

      // 通用业务错误
      setGeneralError(res.msg || '初始化失败，请稍后重试');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : '网络连接异常，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <SiteIcon url={settings.admin.iconUrl} size={28} />
          </div>
          <h1 className="auth-title">{settings.admin.systemName}初始化</h1>
          <p className="auth-subtitle">
            检测到系统尚未初始化，请配置单管理员初始账号及初始化密钥
          </p>
        </div>

        {generalError && (
          <Alert
            message={generalError}
            type="error"
            showIcon
            closable
            onClose={() => setGeneralError(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
          scrollToFirstError
        >
          <Form.Item
            label="管理员用户名"
            name="username"
            rules={[
              { required: true, message: '请输入管理员用户名' },
              {
                pattern: /^[a-zA-Z0-9_]{3,32}$/,
                message: '用户名需为 3–32 位的字母、数字或下划线',
              },
            ]}
          >
            <Input
              prefix={<User size={16} style={{ color: '#94a3b8' }} />}
              placeholder="如：admin"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="管理员密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 12, max: 128, message: '密码长度需在 12–128 位之间' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入密码（12–128 位）"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码以确认' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
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

          <Form.Item
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                初始化密钥
                <Tooltip title="初始化密钥来自后端 server 的 SETUP_KEY 环境变量配置，用于保障初次创建安全">
                  <HelpCircle size={14} style={{ color: '#64748b', cursor: 'pointer' }} />
                </Tooltip>
              </span>
            }
            name="setupKey"
            rules={[{ required: true, message: '请输入服务端初始化密钥' }]}
          >
            <Input.Password
              prefix={<KeyRound size={16} style={{ color: '#94a3b8' }} />}
              placeholder="请输入服务端 SETUP_KEY 环境变量值"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              size="large"
            >
              完成初始化并前往登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            若已初始化过？{' '}
            <Link to="/login" style={{ color: '#2563eb' }}>
              直接登录
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};
