import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Alert, Button, Checkbox, Col, ColorPicker, Flex, Form, Image, Input, InputNumber,
  message, Modal, Row, Select, Space, Spin, Switch, Tabs, Typography,
} from 'antd';
import { Download, FileJson, FolderOpen, Plus, Trash2 } from 'lucide-react';
import {
  createAdminWork, getAdminWorkDetail, updateAdminWork,
  type WorkIconKey, type WorkItem, type WorkPayload, type WorkPlatform,
} from '../../api/works';
import type { FileItem } from '../../api/files';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';
import { DictSelect } from '../../dictionaries';
import { downloadWorkJsonTemplate, parseWorkJsonImport } from './workJsonImport';

const { Text } = Typography;

const ICON_OPTIONS: Array<{ label: string; value: WorkIconKey }> = [
  { label: 'Orbit（星轨 / 效率）', value: 'orbit' },
  { label: 'Feather（羽笔 / 排版）', value: 'feather' },
  { label: 'Audio（声波 / 音频）', value: 'audio' },
  { label: 'Layers（图层 / 设计系统）', value: 'layers' },
  { label: 'Box（容器 / 开发工具）', value: 'box' },
  { label: 'Aperture（光圈 / 影像）', value: 'aperture' },
];

const ACCENT_PRESETS = ['#E5A93C', '#D9B98B', '#4F8BFF', '#C7A969', '#38B287', '#E0A44B'];
const PLATFORM_OPTIONS: WorkPlatform[] = ['PC', 'Web', 'Android'];
const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon'];

export interface ImportedWorkSeed {
  nonce: number;
  fileName: string;
  patch: Partial<WorkPayload>;
  warnings: string[];
}

interface WorkEditorModalProps {
  open: boolean;
  editingUuid: string | null;
  categoryValues?: string[];
  importedSeed?: ImportedWorkSeed | null;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_FORM_VALUES: WorkPayload = {
  slug: '',
  name: '',
  enName: '',
  shortTitle: '',
  tagline: '',
  summary: '',
  category: 'efficiency',
  year: String(new Date().getFullYear()),
  version: 'v1.0.0',
  license: 'MIT',
  platforms: ['Web'],
  accentHex: '#E5A93C',
  iconKey: 'orbit',
  iconImage: '',
  iconFileId: null,
  heroImage: '',
  heroFileId: null,
  heroAlt: '',
  githubUrl: '',
  giteeUrl: '',
  websiteUrl: '',
  installCommand: '',
  metrics: [{ label: '', value: '', context: '' }],
  highlights: [
    { index: '01', title: '', description: '' },
    { index: '02', title: '', description: '' },
    { index: '03', title: '', description: '' },
  ],
  techStack: [{ layer: '', stack: '', note: '' }],
  releases: [{ version: 'v1.0.0', date: `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}`, summary: '' }],
  detailIntro: '',
  detailArchitecture: '',
  featuredHome: true,
  status: 'published',
  sortOrder: 0,
};

function toFormValues(item: WorkItem): WorkPayload {
  return {
    slug: item.slug,
    name: item.name,
    enName: item.enName,
    shortTitle: item.shortTitle,
    tagline: item.tagline,
    summary: item.summary,
    category: item.category,
    year: item.year,
    version: item.version,
    license: item.license,
    platforms: item.platforms,
    accentHex: item.accentHex,
    iconKey: item.iconKey,
    iconImage: item.iconImage,
    iconFileId: item.iconFileId,
    heroImage: item.heroImage,
    heroFileId: item.heroFileId,
    heroAlt: item.heroAlt,
    githubUrl: item.links.github,
    giteeUrl: item.links.gitee,
    websiteUrl: item.links.website,
    installCommand: item.installCommand,
    metrics: item.metrics,
    highlights: item.highlights,
    techStack: item.techStack,
    releases: item.releases,
    detailIntro: item.detailIntro,
    detailArchitecture: item.detailArchitecture,
    featuredHome: item.featuredHome,
    status: item.status,
    sortOrder: item.sortOrder,
  };
}

export function WorkEditorModal({
  open,
  editingUuid,
  categoryValues,
  importedSeed,
  onClose,
  onSaved,
}: WorkEditorModalProps) {
  const [form] = Form.useForm<WorkPayload>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'hero' | 'icon' | null>(null);
  const [importNotice, setImportNotice] = useState<{ fileName: string; warnings: string[] } | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const heroImage = Form.useWatch('heroImage', form);
  const heroFileId = Form.useWatch('heroFileId', form);
  const iconImage = Form.useWatch('iconImage', form);
  const iconFileId = Form.useWatch('iconFileId', form);
  const allowedCategorySet = useMemo(
    () => (categoryValues && categoryValues.length > 0 ? new Set(categoryValues) : undefined),
    [categoryValues],
  );

  useEffect(() => {
    if (!open) {
      setImportNotice(null);
      return;
    }
    if (!editingUuid) {
      form.setFieldsValue(
        importedSeed
          ? { ...DEFAULT_FORM_VALUES, ...importedSeed.patch }
          : DEFAULT_FORM_VALUES,
      );
      setImportNotice(
        importedSeed
          ? { fileName: importedSeed.fileName, warnings: importedSeed.warnings }
          : null,
      );
      return;
    }
    setImportNotice(null);
    setLoading(true);
    void getAdminWorkDetail(editingUuid).then((res) => {
      if (!res.success) throw new Error(res.msg);
      form.setFieldsValue(toFormValues(res.data));
    }).catch((cause: unknown) => {
      message.error(cause instanceof Error ? cause.message : '加载作品详情失败');
      onClose();
    }).finally(() => setLoading(false));
  }, [open, editingUuid, importedSeed, form, onClose]);

  const handleJsonFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseWorkJsonImport(text, allowedCategorySet);
      const current = form.getFieldsValue(true) as WorkPayload;
      form.setFieldsValue({ ...current, ...result.patch });
      setImportNotice({ fileName: file.name, warnings: result.warnings });
      message.success(`已从 ${file.name} 填充 ${result.appliedCount} 项字段，请补充或确认图片与 Icon`);
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : 'JSON 导入失败');
    }
  };

  const handleSelectFile = (files: FileItem[]) => {
    const file = files[0];
    const target = pickerTarget;
    setPickerTarget(null);
    if (!file || !target) return;
    if (target === 'hero') {
      form.setFieldsValue({ heroFileId: file.id, heroImage: file.url });
    } else {
      form.setFieldsValue({ iconFileId: file.id, iconImage: file.url });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: WorkPayload = {
        ...values,
        iconImage: values.iconImage ?? '',
        iconFileId: values.iconFileId ?? null,
        heroFileId: values.heroFileId ?? null,
        heroImage: values.heroImage ?? '',
        heroAlt: values.heroAlt ?? '',
        githubUrl: values.githubUrl ?? '',
        giteeUrl: values.giteeUrl ?? '',
        websiteUrl: values.websiteUrl ?? '',
        installCommand: values.installCommand ?? '',
        detailIntro: values.detailIntro ?? '',
        detailArchitecture: values.detailArchitecture ?? '',
        metrics: values.metrics ?? [],
        highlights: values.highlights ?? [],
        techStack: values.techStack ?? [],
        releases: values.releases ?? [],
      };
      const res = editingUuid
        ? await updateAdminWork(editingUuid, payload)
        : await createAdminWork(payload);
      if (!res.success) throw new Error(res.msg);
      message.success(editingUuid ? '作品已更新' : '作品已创建');
      onSaved();
      onClose();
    } catch (cause) {
      if (cause && typeof cause === 'object' && 'errorFields' in cause) {
        message.warning('请检查必填字段或格式错误');
        return;
      }
      message.error(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title={editingUuid ? '编辑作品档案' : '新增作品'}
        open={open}
        width={940}
        centered
        destroyOnClose
        maskClosable={false}
        onCancel={onClose}
        okText="保存作品"
        cancelText="取消"
        confirmLoading={saving}
        onOk={handleSubmit}
        styles={{
          body: {
            height: 'min(640px, 72vh)',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '4px 12px 8px',
          },
        }}
      >
        <Spin spinning={loading}>
          <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 10px', overflowX: 'hidden' }}>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => void handleJsonFileChange(e)}
            />
            <Flex
              justify="space-between"
              align="center"
              wrap="wrap"
              gap={8}
              style={{
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                支持传入符合 <Text code>WORK_JSON_RULE.md</Text> 的 JSON 文件自动填充文案与架构字段（保留当前图片、Icon 与排序）。
              </Text>
              <Space size={8}>
                <Button size="small" icon={<Download size={14} />} onClick={downloadWorkJsonTemplate}>
                  示例 JSON
                </Button>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<FileJson size={14} />}
                  onClick={() => jsonInputRef.current?.click()}
                >
                  导入 JSON 填充
                </Button>
              </Space>
            </Flex>
            {importNotice ? (
              <Alert
                type={importNotice.warnings.length > 0 ? 'warning' : 'success'}
                showIcon
                closable
                onClose={() => setImportNotice(null)}
                style={{ marginBottom: 12 }}
                message={`已从 ${importNotice.fileName} 填入作品信息，请补充或确认封面图与轮盘 AppIcon 后保存`}
                description={
                  importNotice.warnings.length > 0 ? (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {importNotice.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  ) : undefined
                }
              />
            ) : null}
            <Form form={form} layout="vertical" initialValues={DEFAULT_FORM_VALUES}>
            <Tabs
              items={[
                {
                  key: 'basic',
                  label: '1. 基础与视觉',
                  forceRender: true,
                  children: (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="轮盘短标题与简介将直接显示在首页 100dvh 封面；若上传/选择了轮盘 AppIcon 图片，将优先替换预设矢量图标。"
                      />
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name="name" label="作品中文名" rules={[{ required: true, message: '请输入中文名' }]}>
                            <Input maxLength={60} showCount placeholder="如：星轨笔记" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="enName" label="作品英文名" rules={[{ required: true, message: '请输入英文名' }]}>
                            <Input maxLength={80} placeholder="如：OrbitNote" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="shortTitle" label="轮盘短标题" rules={[{ required: true, message: '请输入轮盘短标题' }]}>
                            <Input maxLength={10} showCount placeholder="建议 4~6 字" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="slug"
                            label="URL Slug"
                            rules={[
                              { required: true, message: '请输入 Slug' },
                              { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: '仅支持小写字母、数字和连字符' },
                            ]}
                          >
                            <Input maxLength={60} placeholder="如：orbitnote" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="category" label="作品分类" rules={[{ required: true, message: '请选择分类' }]}>
                            <DictSelect dict="work_category" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="platforms" label="支持平台" rules={[{ required: true, message: '至少选择一个平台' }]}>
                            <Checkbox.Group options={PLATFORM_OPTIONS} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item name="version" label="当前版本" rules={[{ required: true, message: '请输入版本号' }]}>
                            <Input maxLength={30} placeholder="如：v2.4.0" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="year" label="年份" rules={[{ required: true, message: '请输入年份' }]}>
                            <Input maxLength={12} placeholder="2026" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="license" label="开源协议" rules={[{ required: true, message: '请输入协议' }]}>
                            <Input maxLength={40} placeholder="MIT / Apache-2.0" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="iconKey" label="兜底预设图标" rules={[{ required: true }]}>
                            <Select options={ICON_OPTIONS} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={16}>
                          <Form.Item name="tagline" label="一句话标语（用于悬浮预览卡与详情副标题）" rules={[{ required: true, message: '请输入标语' }]}>
                            <Input maxLength={80} showCount placeholder="精炼描述作品核心定位" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="accentHex"
                            label="主题强调色"
                            getValueFromEvent={(color) => (typeof color === 'string' ? color : color.toHexString().toUpperCase())}
                            rules={[{ required: true }]}
                          >
                            <ColorPicker format="hex" showText presets={[{ label: '推荐色板', colors: ACCENT_PRESETS }]} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="iconFileId" hidden><Input /></Form.Item>
                      <Form.Item label="自定义轮盘 AppIcon 图片（可选，留空则显示预设矢量图标）">
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item name="iconImage" noStyle>
                            <Input
                              placeholder="选择或上传 AppIcon 图片（建议正方形 PNG/WebP/ICO）"
                              onChange={() => form.setFieldValue('iconFileId', null)}
                            />
                          </Form.Item>
                          <Button icon={<FolderOpen size={16} />} onClick={() => setPickerTarget('icon')}>
                            选择 / 上传 AppIcon
                          </Button>
                          {iconImage ? (
                            <Button onClick={() => form.setFieldsValue({ iconImage: '', iconFileId: null })}>
                              恢复预设图标
                            </Button>
                          ) : null}
                        </Space.Compact>
                        {iconFileId ? (
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            已关联文件库 ID：{iconFileId}
                          </Text>
                        ) : null}
                        {iconImage ? (
                          <div style={{ marginTop: 8 }}>
                            <Image
                              src={iconImage}
                              alt="AppIcon 预览"
                              width={56}
                              height={56}
                              style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }}
                            />
                          </div>
                        ) : null}
                      </Form.Item>

                      <Form.Item name="summary" label="作品简介（首页首屏与卡片描述）" rules={[{ required: true, message: '请输入作品简介' }]}>
                        <Input.TextArea rows={3} maxLength={200} showCount placeholder="建议 80~120 字" />
                      </Form.Item>

                      <Form.Item name="heroFileId" hidden><Input /></Form.Item>
                      <Form.Item label="封面图片（推荐 16:9 或 4:3，支持本地/七牛上传选择）">
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item name="heroImage" noStyle>
                            <Input
                              placeholder="从右侧选择或上传图片，也可填 /images/works/xxx.jpg"
                              onChange={() => form.setFieldValue('heroFileId', null)}
                            />
                          </Form.Item>
                          <Button icon={<FolderOpen size={16} />} onClick={() => setPickerTarget('hero')}>
                            选择 / 上传封面
                          </Button>
                          {heroImage ? (
                            <Button onClick={() => form.setFieldsValue({ heroImage: '', heroFileId: null })}>
                              清空
                            </Button>
                          ) : null}
                        </Space.Compact>
                        {heroFileId ? (
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            已关联文件库 ID：{heroFileId}（已开启防误删保护）
                          </Text>
                        ) : null}
                        {heroImage ? (
                          <div style={{ marginTop: 10 }}>
                            <Image
                              src={heroImage}
                              alt="封面预览"
                              width={240}
                              height={135}
                              style={{ objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                            />
                          </div>
                        ) : null}
                      </Form.Item>

                      <Form.Item name="heroAlt" label="封面图片 Alt 描述（利于 SEO）">
                        <Input maxLength={200} placeholder="描述画面主要内容，供搜索引擎与读屏器识别" />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'highlights',
                  label: '2. 亮点与指标',
                  forceRender: true,
                  children: (
                    <>
                      <Form.Item name="detailIntro" label="设计缘起 / 导语（Slide 2 右侧 & 详情页展示）">
                        <Input.TextArea rows={3} maxLength={300} showCount placeholder="说明作品创作背景与核心理念" />
                      </Form.Item>

                      <Text strong style={{ display: 'block', marginBottom: 8 }}>核心亮点（首页 Slide 2 展示前 3 条）</Text>
                      <Form.List name="highlights">
                        {(fields, { add, remove }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            {fields.map((field, idx) => (
                              <div key={field.key} style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                <Row gutter={12} align="middle">
                                  <Col span={4}>
                                    <Form.Item {...field} name={[field.name, 'index']} label="序号" rules={[{ required: true }]}>
                                      <Input maxLength={10} placeholder={`0${idx + 1}`} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={18}>
                                    <Form.Item {...field} name={[field.name, 'title']} label="亮点标题" rules={[{ required: true }]}>
                                      <Input maxLength={40} showCount placeholder="建议 14 字以内" />
                                    </Form.Item>
                                  </Col>
                                  <Col span={2} style={{ textAlign: 'right' }}>
                                    <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                                  </Col>
                                </Row>
                                <Form.Item {...field} name={[field.name, 'description']} label="亮点详情" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                  <Input.TextArea rows={2} maxLength={160} showCount placeholder="建议 60 字左右" />
                                </Form.Item>
                              </div>
                            ))}
                            {fields.length < 6 ? (
                              <Button
                                type="dashed"
                                icon={<Plus size={16} />}
                                onClick={() => add({ index: `0${fields.length + 1}`, title: '', description: '' })}
                              >
                                添加亮点
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </Form.List>

                      <Text strong style={{ display: 'block', marginBottom: 8 }}>量化性能指标（首页 Slide 1 & 2 展示前 3 条）</Text>
                      <Form.List name="metrics">
                        {(fields, { add, remove }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {fields.map((field) => (
                              <Row key={field.key} gutter={12} align="middle">
                                <Col span={6}>
                                  <Form.Item {...field} name={[field.name, 'value']} rules={[{ required: true, message: '数值必填' }]}>
                                    <Input maxLength={30} placeholder="数值，如 14 ms" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item {...field} name={[field.name, 'label']} rules={[{ required: true, message: '标签必填' }]}>
                                    <Input maxLength={40} placeholder="指标名称" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item {...field} name={[field.name, 'context']}>
                                    <Input maxLength={80} placeholder="测试环境或补充说明" />
                                  </Form.Item>
                                </Col>
                                <Col span={2}>
                                  <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                                </Col>
                              </Row>
                            ))}
                            {fields.length < 6 ? (
                              <Button type="dashed" icon={<Plus size={16} />} onClick={() => add({ label: '', value: '', context: '' })}>
                                添加指标
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </Form.List>
                    </>
                  ),
                },
                {
                  key: 'architecture',
                  label: '3. 架构与链接',
                  forceRender: true,
                  children: (
                    <>
                      <Form.Item name="detailArchitecture" label="工程架构概述（Slide 3 & 详情页）">
                        <Input.TextArea rows={3} maxLength={400} showCount placeholder="阐述前后端分层、数据流与核心技术决策" />
                      </Form.Item>

                      <Text strong style={{ display: 'block', marginBottom: 8 }}>技术栈分层（首页 Slide 3 展示前 4 行）</Text>
                      <Form.List name="techStack">
                        {(fields, { add, remove }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {fields.map((field) => (
                              <Row key={field.key} gutter={12} align="middle">
                                <Col span={6}>
                                  <Form.Item {...field} name={[field.name, 'layer']} rules={[{ required: true, message: '层级必填' }]}>
                                    <Input maxLength={40} placeholder="如：排版内核" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item {...field} name={[field.name, 'stack']} rules={[{ required: true, message: '技术栈必填' }]}>
                                    <Input maxLength={80} placeholder="如：Rust · WebAssembly" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item {...field} name={[field.name, 'note']}>
                                    <Input maxLength={120} placeholder="简短特性说明" />
                                  </Form.Item>
                                </Col>
                                <Col span={2}>
                                  <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                                </Col>
                              </Row>
                            ))}
                            {fields.length < 8 ? (
                              <Button type="dashed" icon={<Plus size={16} />} onClick={() => add({ layer: '', stack: '', note: '' })}>
                                添加架构层
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </Form.List>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name="githubUrl" label="GitHub 仓库地址">
                            <Input maxLength={500} placeholder="https://github.com/..." />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="giteeUrl" label="Gitee 镜像地址">
                            <Input maxLength={500} placeholder="https://gitee.com/..." />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="websiteUrl" label="作品官网 / 体验地址（留空则前端按钮禁用并提示暂未开放）">
                            <Input maxLength={500} placeholder="https://...（可选）" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item name="installCommand" label="快速安装命令（仅在作品详情页展示）">
                        <Input maxLength={300} placeholder="如：npm install @xxx/cli" />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'releases',
                  label: '4. 版本演进',
                  forceRender: true,
                  children: (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="首页第 4 页仅展示前 3 条最新里程碑；完整更新历史会在详情页全量呈现。"
                      />
                      <Form.List name="releases">
                        {(fields, { add, remove }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {fields.map((field) => (
                              <Row key={field.key} gutter={12} align="middle">
                                <Col span={5}>
                                  <Form.Item {...field} name={[field.name, 'version']} rules={[{ required: true, message: '版本号必填' }]}>
                                    <Input maxLength={30} placeholder="v1.0.0" />
                                  </Form.Item>
                                </Col>
                                <Col span={4}>
                                  <Form.Item {...field} name={[field.name, 'date']} rules={[{ required: true, message: '日期必填' }]}>
                                    <Input maxLength={20} placeholder="2026.10" />
                                  </Form.Item>
                                </Col>
                                <Col span={13}>
                                  <Form.Item {...field} name={[field.name, 'summary']} rules={[{ required: true, message: '更新摘要必填' }]}>
                                    <Input maxLength={200} placeholder="本版本主要新增特性或重构内容" />
                                  </Form.Item>
                                </Col>
                                <Col span={2}>
                                  <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                                </Col>
                              </Row>
                            ))}
                            {fields.length < 20 ? (
                              <Button type="dashed" icon={<Plus size={16} />} onClick={() => add({ version: '', date: '', summary: '' })}>
                                添加版本里程碑
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </Form.List>
                    </>
                  ),
                },
                {
                  key: 'publish',
                  label: '5. 发布与排序',
                  forceRender: true,
                  children: (
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="status" label="发布状态">
                          <Select
                            options={[
                              { label: '已发布（公开展示）', value: 'published' },
                              { label: '草稿（仅后台可见）', value: 'draft' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="featuredHome" label="展示在首页时钟轮盘" valuePropName="checked">
                          <Switch checkedChildren="展示" unCheckedChildren="隐藏" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="sortOrder" label="排序权重（数值越小越靠前）">
                          <InputNumber min={0} max={1_000_000} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
            </Form>
          </div>
        </Spin>
      </Modal>

      <FilePickerModal
        open={pickerTarget !== null}
        zIndex={1200}
        accept={IMAGE_ACCEPT}
        onCancel={() => setPickerTarget(null)}
        onConfirm={handleSelectFile}
      />
    </>
  );
}
