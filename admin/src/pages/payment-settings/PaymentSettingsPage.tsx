import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, message, Row, Select, Skeleton, Switch, Tabs, Typography, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { CreditCard, Save, Upload as UploadIcon } from 'lucide-react';
import {
  getAlipaySettings, getWechatPaySettings, saveAlipaySettings, saveWechatPaySettings,
  type AlipaySettings, type AlipaySettingsInput, type WechatPaySettings, type WechatPaySettingsInput,
} from '../../api/paymentSettings';

const { Title, Paragraph, Text } = Typography;

function CertificateField({ label, configured, pending, onRead }: {
  label: string; configured: boolean; pending: boolean; onRead: (content: string) => void;
}) {
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (file.size > 64 * 1024) {
      message.error(`${label}不能超过 64 KiB`);
      return false;
    }
    try {
      onRead(await file.text());
      message.success(`${label}已选择，保存设置后生效`);
    } catch { message.error(`${label}读取失败`); }
    return false;
  };
  return <div style={{ marginBottom: 24 }}>
    <div style={{ marginBottom: 8 }}>{label}</div>
    <Upload accept=".pem,.crt,.cert,.key" showUploadList={false} beforeUpload={beforeUpload}>
      <Button icon={<UploadIcon size={16} />}>选择文件</Button>
    </Upload>
    <Text type="secondary" style={{ marginLeft: 12 }}>
      {pending ? '已选择新文件，待保存' : configured ? '已配置，未选择新文件则保持原内容' : '未配置'}
    </Text>
  </div>;
}

function ErrorAlert({ error }: { error: string | null }) {
  return error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} /> : null;
}

function AlipayForm() {
  const [form] = Form.useForm<AlipaySettingsInput>();
  const [settings, setSettings] = useState<AlipaySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAlipaySettings().then((response) => {
      if (!response.success) throw new Error(response.msg);
      setSettings(response.data);
      form.setFieldsValue(response.data);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '加载失败'));
  }, [form]);

  const save = async (values: AlipaySettingsInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await saveAlipaySettings(values);
      if (!response.success) throw new Error(response.msg);
      setSettings(response.data);
      for (const key of ['privateKey', 'alipayPublicKey', 'appPublicKey', 'aesKey'] as const) form.setFieldValue(key, '');
      message.success('支付宝设置已保存');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败'); }
    finally { setSaving(false); }
  };

  if (!settings) return <Card>{error ? <ErrorAlert error={error} /> : <Skeleton active />}</Card>;
  return <Card style={{ maxWidth: 900, borderRadius: 16 }}>
    <ErrorAlert error={error} />
    <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="appId" label="应用 App ID"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="keyType" label="应用私钥格式"><Select options={[{ value: 'PKCS8' }, { value: 'PKCS1' }]} /></Form.Item></Col>
      </Row>
      <Form.Item name="privateKey" label="应用私钥" extra={settings?.privateKeyConfigured ? '已配置；留空保持原内容' : undefined}>
        <Input.TextArea rows={3} placeholder="粘贴 PEM 私钥" autoComplete="off" />
      </Form.Item>
      <Form.Item name="alipayPublicKey" label="支付宝公钥" extra={settings?.alipayPublicKeyConfigured ? '已配置；留空保持原内容' : undefined}>
        <Input.TextArea rows={3} placeholder="粘贴支付宝公钥 PEM" autoComplete="off" />
      </Form.Item>
      <Form.Item name="appPublicKey" label="应用公钥（可选）" extra={settings?.appPublicKeyConfigured ? '已配置；留空保持原内容' : undefined}>
        <Input.TextArea rows={2} autoComplete="off" />
      </Form.Item>
      <Form.Item name="aesKey" label="接口加密密钥（可选）" extra={settings?.aesKeyConfigured ? '已配置；留空保持原内容' : undefined}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="gateway" label="支付宝网关"><Input /></Form.Item>
      <Form.Item name="notifyUrl" label="异步通知地址"><Input placeholder="https://example.com/api/pay/alipay/notify" /></Form.Item>
      <Form.Item name="returnUrl" label="同步返回地址（可选）"><Input /></Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="enableEncrypt" label="请求加密" valuePropName="checked"><Switch /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="timeoutMs" label="请求超时（毫秒）"><InputNumber min={1000} max={120000} style={{ width: '100%' }} /></Form.Item></Col>
      </Row>
      <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={saving}>保存支付宝设置</Button>
    </Form>
  </Card>;
}

function WechatForm() {
  type FormFields = Omit<WechatPaySettingsInput, 'privateKey' | 'merchantCert' | 'wechatPayPublicKey'>;
  const [form] = Form.useForm<FormFields>();
  const [settings, setSettings] = useState<WechatPaySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState({ privateKey: '', merchantCert: '', wechatPayPublicKey: '' });

  useEffect(() => {
    void getWechatPaySettings().then((response) => {
      if (!response.success) throw new Error(response.msg);
      setSettings(response.data);
      form.setFieldsValue(response.data);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '加载失败'));
  }, [form]);

  const save = async (values: FormFields) => {
    setSaving(true);
    setError(null);
    try {
      const response = await saveWechatPaySettings({ ...values, ...uploads });
      if (!response.success) throw new Error(response.msg);
      setSettings(response.data);
      form.setFieldValue('merchantSerialNo', response.data.merchantSerialNo);
      for (const key of ['appSecret', 'miniAppSecret', 'apiV3Key'] as const) {
        form.setFieldValue(key, '');
      }
      setUploads({ privateKey: '', merchantCert: '', wechatPayPublicKey: '' });
      message.success('微信支付设置已保存');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败'); }
    finally { setSaving(false); }
  };

  if (!settings) return <Card>{error ? <ErrorAlert error={error} /> : <Skeleton active />}</Card>;
  return <Card style={{ maxWidth: 900, borderRadius: 16 }}>
    <ErrorAlert error={error} />
    <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="appId" label="公众号 App ID"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="mchId" label="商户号"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="miniAppId" label="小程序 App ID（可选）"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="merchantSerialNo" label="商户证书序列号" extra="留空时从上传的商户证书提取"><Input /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="appSecret" label="公众号 App Secret" extra={settings?.appSecretConfigured ? '已配置；留空保持原内容' : undefined}><Input.Password autoComplete="new-password" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="miniAppSecret" label="小程序 App Secret（可选）" extra={settings?.miniAppSecretConfigured ? '已配置；留空保持原内容' : undefined}><Input.Password autoComplete="new-password" /></Form.Item></Col>
      </Row>
      <Form.Item name="apiV3Key" label="APIv3 密钥" extra={settings?.apiV3KeyConfigured ? '已配置；留空保持原内容' : undefined}><Input.Password autoComplete="new-password" /></Form.Item>
      <CertificateField label="商户私钥文件" configured={Boolean(settings?.privateKeyConfigured)} pending={Boolean(uploads.privateKey)}
        onRead={(content) => setUploads((old) => ({ ...old, privateKey: content }))} />
      <CertificateField label="商户证书文件" configured={Boolean(settings?.merchantCertConfigured)} pending={Boolean(uploads.merchantCert)}
        onRead={(content) => { setUploads((old) => ({ ...old, merchantCert: content })); form.setFieldValue('merchantSerialNo', ''); }} />
      <Row gutter={16}>
        <Col xs={24} md={12}><Form.Item name="wechatPayPublicKeyId" label="微信支付平台公钥 ID（可选）"><Input /></Form.Item></Col>
        <Col xs={24} md={12}>
          <CertificateField label="微信支付平台公钥文件（可选）" configured={Boolean(settings?.wechatPayPublicKeyConfigured)} pending={Boolean(uploads.wechatPayPublicKey)}
            onRead={(content) => setUploads((old) => ({ ...old, wechatPayPublicKey: content }))} />
        </Col>
      </Row>
      <Form.Item name="gateway" label="微信支付网关" extra="当前微信 SDK 固定请求官方域名，此项保留供业务项目自定义接入"><Input /></Form.Item>
      <Form.Item name="notifyUrl" label="支付异步通知地址"><Input placeholder="https://example.com/api/pay/wechat/notify" /></Form.Item>
      <Form.Item name="oauthCallbackUrl" label="网页授权回调地址（可选）"><Input /></Form.Item>
      <Form.Item name="oauthAllowedOrigin" label="网页授权允许的来源（可选）"><Input /></Form.Item>
      <Form.Item name="timeoutMs" label="请求超时（毫秒）" extra="当前微信 SDK 不使用此项，供业务项目自定义接入"><InputNumber min={1000} max={120000} style={{ width: '100%' }} /></Form.Item>
      <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={saving}>保存微信支付设置</Button>
    </Form>
  </Card>;
}

export function PaymentSettingsPage() {
  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', marginBottom: 8 }}>
      <CreditCard size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>支付能力</Text>
    </div>
    <Title level={2} style={{ margin: 0 }}>支付设置</Title>
    <Paragraph type="secondary" style={{ margin: '8px 0 24px' }}>
      配置支付宝和微信支付凭据。订单创建、支付通知与退款接口由具体业务项目接入。
    </Paragraph>
    <Tabs items={[{ key: 'alipay', label: '支付宝', children: <AlipayForm /> },
      { key: 'wechat', label: '微信支付', children: <WechatForm /> }]} />
  </div>;
}
