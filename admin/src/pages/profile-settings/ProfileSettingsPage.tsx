import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Divider, Flex, Form, Image, Input, InputNumber,
  message, Row, Select, Space, Spin, Switch, Typography,
} from 'antd';
import { FolderOpen, Plus, Save, Trash2, UserRound } from 'lucide-react';
import type { FileItem } from '../../api/files';
import {
  getProfileSettings, updateProfileSettings,
  type ProfileSettingsData,
} from '../../api/profileSettings';
import { getSiteSettings, updateSiteSettings } from '../../api/siteSettings';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';
import { SiteIconsFieldGroup } from './SiteIconsFieldGroup';

const { Title, Text, Paragraph } = Typography;
const OG_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

interface UnifiedProfileForm extends ProfileSettingsData {
  adminIdentity: {
    siteTitle: string;
    systemName: string;
  };
}

export function ProfileSettingsPage() {
  const [form] = Form.useForm<UnifiedProfileForm>();
  const { setSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const ogImage = Form.useWatch(['site', 'ogImage'], form);
  const ogImageFileId = Form.useWatch(['site', 'ogImageFileId'], form);
  const autoRotateEnabled = Form.useWatch(['showcase', 'autoRotateEnabled'], form);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void Promise.all([
      getProfileSettings(controller.signal),
      getSiteSettings(),
    ]).then(([profileRes, siteRes]) => {
      if (!profileRes.success) throw new Error(profileRes.msg);
      if (!siteRes.success) throw new Error(siteRes.msg);
      setSettings(siteRes.data);
      const clientSystemName = siteRes.data.client.systemName.trim();
      const clientSiteTitle = siteRes.data.client.siteTitle.trim();
      form.setFieldsValue({
        ...profileRes.data,
        site: {
          ...profileRes.data.site,
          brandName: clientSystemName && clientSystemName !== 'MySite'
            ? clientSystemName
            : profileRes.data.site.brandName,
          title: clientSiteTitle && clientSiteTitle !== 'MySite'
            ? clientSiteTitle
            : profileRes.data.site.title,
        },
        adminIdentity: {
          siteTitle: siteRes.data.admin.siteTitle,
          systemName: siteRes.data.admin.systemName,
        },
      });
      setError(null);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : '加载主页配置失败');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [form, setSettings]);

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
      const profilePayload: ProfileSettingsData = {
        site: {
          ...values.site,
          ogImageFileId: values.site.ogImageFileId ?? null,
          keywords: values.site.keywords ?? [],
        },
        footer: values.footer,
        about: {
          ...values.about,
          principles: values.about.principles ?? [],
        },
        showcase: {
          autoRotateEnabled: values.showcase?.autoRotateEnabled ?? true,
          autoRotateIntervalSec: values.showcase?.autoRotateIntervalSec ?? 5,
        },
      };

      const [profileRes, siteRes] = await Promise.all([
        updateProfileSettings(profilePayload),
        updateSiteSettings({
          admin: {
            siteTitle: values.adminIdentity.siteTitle.trim(),
            systemName: values.adminIdentity.systemName.trim(),
          },
          client: {
            siteTitle: values.site.title.trim(),
            systemName: values.site.brandName.trim(),
          },
        }),
      ]);
      if (!profileRes.success) throw new Error(profileRes.msg);
      if (!siteRes.success) throw new Error(siteRes.msg);

      setSettings(siteRes.data);
      form.setFieldsValue({
        ...profileRes.data,
        adminIdentity: {
          siteTitle: siteRes.data.admin.siteTitle,
          systemName: siteRes.data.admin.systemName,
        },
      });
      message.success('主页与站点配置已保存');
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
            <Text style={{ color: '#2563eb', fontWeight: 600 }}>个人主页与站点标识</Text>
          </Space>
          <Title level={2} style={{ margin: 0 }}>主页配置</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
            统一管理前台网站名称、图标、SEO 信息、自动轮播、作者档案、管理端标识与页脚版权备案。
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
            <Card title="网站信息、图标与 SEO" style={{ borderRadius: 16 }}>
              <SiteIconsFieldGroup />

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['site', 'brandName']}
                    label="前台网站名称（左上角展示）"
                    rules={[{ required: true, message: '请输入前台网站名称' }]}
                  >
                    <Input maxLength={60} placeholder="如：MySite" />
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
                  <Form.Item
                    name={['site', 'title']}
                    label="前台标签页标题 / SEO Title"
                    rules={[{ required: true, message: '请输入标签页标题' }]}
                  >
                    <Input maxLength={100} showCount />
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

              <Divider style={{ margin: '12px 0 16px' }} />
              <Text strong style={{ display: 'block', marginBottom: 12 }}>管理后台基础标识</Text>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['adminIdentity', 'siteTitle']}
                    label="管理后台标签页名称"
                    rules={[{ required: true, message: '请输入后台标签页名称' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input maxLength={100} placeholder="显示在管理端浏览器标签上" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['adminIdentity', 'systemName']}
                    label="管理后台系统名称"
                    rules={[{ required: true, message: '请输入后台系统名称' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input maxLength={100} placeholder="显示在后台侧栏、登录页与页脚" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="首页自动轮播配置" style={{ borderRadius: 16 }}>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="访客位于首页第 1 屏且未搜索时，按设定间隔自动切换左侧轮盘作品；一旦手动操作轮盘或翻页，本次会话（sessionStorage）将不再自动切换。"
              />
              <Row gutter={16} align="middle">
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['showcase', 'autoRotateEnabled']}
                    label="首页自动轮播"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['showcase', 'autoRotateIntervalSec']}
                    label="轮播间隔（秒）"
                    rules={[
                      { required: true, message: '请输入轮播间隔' },
                      { type: 'number', min: 1, max: 120, message: '间隔需在 1 ~ 120 秒之间' },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={1}
                      max={120}
                      precision={0}
                      disabled={autoRotateEnabled === false}
                      addonAfter="秒"
                      style={{ width: 180 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
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
