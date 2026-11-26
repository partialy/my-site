import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, message, Radio, Skeleton, Space, Typography } from 'antd';
import { CloudUpload, Save } from 'lucide-react';
import { getUploadSettings, saveUploadSettings, type UploadSettingsInput } from '../../api/uploadSettings';

const { Title, Paragraph, Text } = Typography;

export function UploadSettingsPage() {
  const [form] = Form.useForm<UploadSettingsInput>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretConfigured, setSecretConfigured] = useState(false);
  const strategy = Form.useWatch('strategy', form);

  useEffect(() => {
    void getUploadSettings().then((response) => {
      if (!response.success) throw new Error(response.msg);
      const { secretKeyConfigured, ...settings } = response.data;
      setSecretConfigured(secretKeyConfigured);
      form.setFieldsValue({ ...settings, secretKey: '' });
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [form]);

  const save = async (values: UploadSettingsInput) => {
    setSaving(true);
    setError(null);
    try {
      const merged = { ...form.getFieldsValue(true), ...values };
      const payload: UploadSettingsInput = {
        strategy: merged.strategy ?? 'local',
        localDomain: merged.localDomain ?? '',
        accessKey: merged.accessKey ?? '',
        secretKey: merged.secretKey ?? '',
        bucket: merged.bucket ?? '',
        root: merged.root ?? '',
        uploadUrl: merged.uploadUrl || 'https://upload.qiniup.com',
        domain: merged.domain ?? '',
      };
      const response = await saveUploadSettings(payload);
      if (!response.success) throw new Error(response.msg);
      const { secretKeyConfigured, ...nextSettings } = response.data;
      setSecretConfigured(secretKeyConfigured);
      form.setFieldsValue({ ...nextSettings, secretKey: '' });
      message.success('上传设置已保存');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally { setSaving(false); }
  };

  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><CloudUpload size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>文件存储</Text></Space>
    <Title level={2} style={{ margin: 0 }}>上传设置</Title>
    <Paragraph type="secondary" style={{ margin: '8px 0 24px' }}>选择文件上传策略。切换策略不会迁移已有文件，已有文件继续使用原访问地址。</Paragraph>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}
    {loading ? <Card><Skeleton active /></Card> : <Card style={{ maxWidth: 760, borderRadius: 16 }}>
      <Form form={form} layout="vertical" onFinish={(values) => void save(values)}>
        <Form.Item name="strategy" label="上传策略" rules={[{ required: true }]}>
          <Radio.Group optionType="button" buttonStyle="solid" options={[{ label: '本地存储', value: 'local' }, { label: '七牛云存储', value: 'qiniu' }]} />
        </Form.Item>
        {strategy === 'local' && <Form.Item name="localDomain" label="本地文件访问域名"
          extra="生产环境建议填写直接对外提供文件服务的 HTTPS 域名；留空时使用当前站点域名。">
          <Input placeholder="https://files.example.com" />
        </Form.Item>}
        {strategy === 'qiniu' && <>
          <Form.Item name="accessKey" label="Access Key" rules={[{ required: true, message: '请输入 Access Key' }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="secretKey" label="Secret Key" extra={secretConfigured ? '已配置；留空表示保持原密钥' : undefined}
            rules={secretConfigured ? [] : [{ required: true, message: '请输入 Secret Key' }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item name="bucket" label="存储空间 Bucket" rules={[{ required: true, message: '请输入 Bucket' }]}><Input /></Form.Item>
          <Form.Item name="root" label="上传根目录" htmlFor="upload-root" rules={[{ required: true, message: '请输入上传根目录' }]}><Input id="upload-root" placeholder='如 system' /></Form.Item>
          <Form.Item name="uploadUrl" label="上传域名" rules={[{ required: true, message: '请输入上传域名' }, { type: 'url', message: '请输入完整 HTTPS URL' }]}><Input placeholder="https://upload.qiniup.com" /></Form.Item>
          <Form.Item name="domain" label="文件访问域名" rules={[{ required: true, message: '请输入访问域名' }]}><Input placeholder="https://example.com 或 //example.com" /></Form.Item>
        </>}
        <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={saving}>保存设置</Button>
      </Form>
    </Card>}
  </div>;
}
