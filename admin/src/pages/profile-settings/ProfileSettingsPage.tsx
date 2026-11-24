import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Flex, Form, Image, Input, message, Row, Select, Space, Spin, Typography,
} from 'antd';
import { FolderOpen, Plus, Save, Trash2, UserRound } from 'lucide-react';
import type { FileItem } from '../../api/files';
import {
  getProfileSettings, updateProfileSettings,
  type ProfileSettingsData,
} from '../../api/profileSettings';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';

const { Title, Text, Paragraph } = Typography;
const OG_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

export function ProfileSettingsPage() {
  const [form] = Form.useForm<ProfileSettingsData>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const ogImage = Form.useWatch(['site', 'ogImage'], form);
  const ogImageFileId = Form.useWatch(['site', 'ogImageFileId'], form);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void getProfileSettings(controller.signal).then((res) => {
      if (!res.success) throw new Error(res.msg);
      form.setFieldsValue(res.data);
      setError(null);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : '加载主页配置失败');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [form]);

  const handleSelectOgImage = (files: FileItem[]) => {
    const file = files[0];
    setPickerOpen(false);
    if (!file) return;
    form.setFieldValue(['site', 'ogImageFileId'], file.id);
    form.setFieldValue(['site', 'ogImage'], file.url);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await updateProfileSettings({
        ...values,
        site: {
          ...values.site,
          ogImageFileId: values.site.ogImageFileId ?? null,
          keywords: values.site.keywords ?? [],
        },
        about: {
          ...values.about,
          principles: values.about.principles ?? [],
        },
      });
      if (!res.success) throw new Error(res.msg);
      form.setFieldsValue(res.data);
      message.success('主页配置已保存');
    } catch (cause) {
      if (cause && typeof cause === 'object' && 'errorFields' in cause) {
        message.warning('请检查必填字段格式');
        return;
      }
      message.error(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="flex-end" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}>
            <UserRound size={17} />
            <Text style={{ color: '#2563eb', fontWeight: 600 }}>个人主页内容</Text>
          </Space>
          <Title level={2} style={{ margin: 0 }}>主页配置</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
            统一配置前台个人主页的品牌 SEO 信息、关于作者档案、创作原则与底部版权备案。
          </Paragraph>
        </div>
        <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={loading} onClick={handleSave}>
          保存全部配置
        </Button>
      </Flex>

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Card title="站点品牌与 SEO 信息" style={{ borderRadius: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name={['site', 'brandName']} label="品牌展示名" rules={[{ required: true }]}>
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['site', 'brandEn']} label="英文标识" rules={[{ required: true }]}>
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['site', 'domainLabel']} label="展示域名标签" rules={[{ required: true }]}>
                    <Input maxLength={100} placeholder="partialy.cn" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={14}>
                  <Form.Item name={['site', 'title']} label="浏览器首页标题（SEO Title）" rules={[{ required: true }]}>
                    <Input maxLength={150} showCount />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item name={['site', 'url']} label="站点规范访问根 URL" rules={[{ required: true, type: 'url', message: '请输入完整 URL' }]}>
                    <Input placeholder="https://partialy.cn" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name={['site', 'description']} label="SEO 描述（Meta Description）" rules={[{ required: true }]}>
                <Input.TextArea rows={2} maxLength={300} showCount />
              </Form.Item>

              <Form.Item name={['site', 'keywords']} label="SEO 关键词（回车新增）">
                <Select mode="tags" tokenSeparators={[',', '，']} placeholder="输入关键词后按回车" />
              </Form.Item>

              <Form.Item name={['site', 'ogImageFileId']} hidden><Input /></Form.Item>
              <Form.Item label="默认 Open Graph 分享图（支持文件库选择或上传）">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name={['site', 'ogImage']} noStyle rules={[{ required: true, message: '请输入或选择分享图' }]}>
                    <Input
                      placeholder="/images/works/orbitnote.jpg 或图片 URL"
                      onChange={() => form.setFieldValue(['site', 'ogImageFileId'], null)}
                    />
                  </Form.Item>
                  <Button icon={<FolderOpen size={16} />} onClick={() => setPickerOpen(true)}>
                    选择 / 上传图片
                  </Button>
                </Space.Compact>
                {ogImageFileId ? (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    已关联文件库 ID：{ogImageFileId}
                  </Text>
                ) : null}
                {ogImage ? (
                  <div style={{ marginTop: 10 }}>
                    <Image
                      src={ogImage}
                      alt="OG 预览"
                      width={220}
                      height={124}
                      style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                    />
                  </div>
                ) : null}
              </Form.Item>
            </Card>

            <Card title="关于作者与三条创作原则" style={{ borderRadius: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item name={['about', 'authorName']} label="作者名称" rules={[{ required: true }]}>
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={['about', 'authorRole']} label="职业头衔" rules={[{ required: true }]}>
                    <Input maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={5}>
                  <Form.Item name={['about', 'location']} label="常驻城市" rules={[{ required: true }]}>
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={5}>
                  <Form.Item name={['about', 'email']} label="联系邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name={['about', 'bio']} label="个人简介" rules={[{ required: true }]}>
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>

              <Text strong style={{ display: 'block', marginBottom: 8 }}>创作原则卡片（推荐保留 3 条）</Text>
              <Form.List name={['about', 'principles']}>
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {fields.map((field, idx) => (
                      <div key={field.key} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <Row gutter={12} align="middle">
                          <Col span={4}>
                            <Form.Item {...field} name={[field.name, 'index']} label="序号" rules={[{ required: true }]}>
                              <Input maxLength={10} placeholder={`0${idx + 1}`} />
                            </Form.Item>
                          </Col>
                          <Col span={18}>
                            <Form.Item {...field} name={[field.name, 'title']} label="原则标题" rules={[{ required: true }]}>
                              <Input maxLength={60} />
                            </Form.Item>
                          </Col>
                          <Col span={2} style={{ textAlign: 'right' }}>
                            <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                        <Form.Item {...field} name={[field.name, 'body']} label="详细阐述" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <Input.TextArea rows={2} maxLength={300} showCount />
                        </Form.Item>
                      </div>
                    ))}
                    {fields.length < 6 ? (
                      <Button type="dashed" icon={<Plus size={16} />} onClick={() => add({ index: `0${fields.length + 1}`, title: '', body: '' })}>
                        添加创作原则
                      </Button>
                    ) : null}
                  </div>
                )}
              </Form.List>
            </Card>

            <Card title="页脚版权与备案信息" style={{ borderRadius: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item name={['footer', 'years']} label="版权年份" rules={[{ required: true }]}>
                    <Input maxLength={30} placeholder="2025-2026" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name={['footer', 'owner']} label="版权所有者" rules={[{ required: true }]}>
                    <Input maxLength={60} placeholder="Partial" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name={['footer', 'domain']} label="展示域名" rules={[{ required: true }]}>
                    <Input maxLength={100} placeholder="partialy.cn" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name={['footer', 'domainHref']} label="域名跳转链接" rules={[{ required: true, type: 'url' }]}>
                    <Input placeholder="https://partialy.cn" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name={['footer', 'icpNumber']} label="ICP 备案号">
                    <Input maxLength={80} placeholder="京ICP xxxxx号" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={['footer', 'icpHref']} label="工信部备案跳转链接" rules={[{ required: true, type: 'url' }]}>
                    <Input placeholder="https://beian.miit.gov.cn/" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Space>
        </Form>
      </Spin>

      <FilePickerModal
        open={pickerOpen}
        accept={OG_ACCEPT}
        onCancel={() => setPickerOpen(false)}
        onConfirm={handleSelectOgImage}
      />
    </div>
  );
}
