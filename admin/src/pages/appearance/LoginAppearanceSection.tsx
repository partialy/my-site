import { useEffect, useState } from 'react';
import { Alert, Button, Card, ColorPicker, Flex, message, Select, Segmented, Slider, Space, Typography } from 'antd';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { updateLoginAppearance, type LoginAppearance, type LoginAppearanceInput } from '../../api/siteSettings';
import type { FileItem } from '../../api/files';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';
import { loginBackgroundStyle, loginCardStyle } from '../../site-settings/loginAppearance';
import './appearance.css';

const { Text, Title } = Typography;
const directions = [
  { label: '向上', value: 0 }, { label: '右上', value: 45 }, { label: '向右', value: 90 },
  { label: '右下', value: 135 }, { label: '向下', value: 180 }, { label: '左下', value: 225 },
  { label: '向左', value: 270 }, { label: '左上', value: 315 },
];

function inputOf(value: LoginAppearance): LoginAppearanceInput {
  return {
    backgroundMode: value.backgroundMode, solidColor: value.solidColor,
    gradientStartColor: value.gradientStartColor, gradientEndColor: value.gradientEndColor,
    gradientDirection: value.gradientDirection,
    backgroundFileId: value.backgroundMode === 'image' ? value.backgroundFileId : null,
    cardOpacity: value.cardOpacity,
  };
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="appearance-color-field">
    <Text strong>{label}</Text>
    <Flex align="center" gap={10}>
      <ColorPicker value={value} onChangeComplete={(color) => onChange(color.toHexString())} showText />
    </Flex>
  </label>;
}

export function LoginAppearanceSection() {
  const { settings, setSettings } = useSiteSettings();
  const [draft, setDraft] = useState<LoginAppearance>(settings.loginAppearance);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(settings.loginAppearance), [settings.loginAppearance]);
  const dirty = JSON.stringify(inputOf(draft)) !== JSON.stringify(inputOf(settings.loginAppearance));
  const change = (fields: Partial<LoginAppearance>) => setDraft((current) => ({ ...current, ...fields }));

  const selectBackground = (files: FileItem[]) => {
    const file = files[0];
    if (!file) return;
    change({ backgroundFileId: file.id, backgroundUrl: file.url, backgroundMode: 'image' });
    setPickerOpen(false);
  };

  const save = async () => {
    if (draft.backgroundMode === 'image' && !draft.backgroundFileId) {
      setError('请先选择一张背景图片');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateLoginAppearance(inputOf(draft));
      if (!result.success) throw new Error(result.msg);
      setSettings(result.data);
      message.success('登录外观已保存');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存登录外观失败');
    } finally {
      setSaving(false);
    }
  };

  return <Card styles={{ body: { padding: 28 } }} style={{ borderRadius: 16 }}>
    <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Title level={4} style={{ margin: '0 0 5px' }}>登录界面背景</Title>
        <Text type="secondary">设置整页背景与登录卡片的背景透明度，修改后可在下方预览。</Text>
      </div>
      <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={!dirty} onClick={() => void save()}>保存外观</Button>
    </Flex>
    {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 18 }} />}

    <div className="appearance-controls">
      <div className="appearance-control-group">
        <Text strong>背景类型</Text>
        <Segmented block value={draft.backgroundMode} onChange={(value) => change({ backgroundMode: value as LoginAppearance['backgroundMode'] })}
          options={[{ label: '纯色', value: 'solid' }, { label: '渐变', value: 'gradient' }, { label: '图片', value: 'image' }]} />
      </div>

      {draft.backgroundMode === 'solid' && <ColorField label="背景颜色" value={draft.solidColor} onChange={(solidColor) => change({ solidColor })} />}
      {draft.backgroundMode === 'gradient' && <div className="appearance-gradient-fields">
        <ColorField label="起始颜色" value={draft.gradientStartColor} onChange={(gradientStartColor) => change({ gradientStartColor })} />
        <ColorField label="结束颜色" value={draft.gradientEndColor} onChange={(gradientEndColor) => change({ gradientEndColor })} />
        <label className="appearance-color-field">
          <Text strong>渐变方向</Text>
          <Select value={draft.gradientDirection} options={directions} onChange={(gradientDirection) => change({ gradientDirection })} style={{ width: 150 }} />
        </label>
      </div>}
      {draft.backgroundMode === 'image' && <div className="appearance-control-group">
        <Text strong>背景图片</Text>
        <Space wrap>
          <Button icon={<ImagePlus size={16} />} onClick={() => setPickerOpen(true)}>{draft.backgroundFileId ? '更换图片' : '选择图片'}</Button>
          {draft.backgroundFileId && <Button danger icon={<Trash2 size={15} />} onClick={() => change({ backgroundFileId: null, backgroundUrl: null, backgroundMode: 'solid' })}>移除图片</Button>}
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>从文件管理器选择，也可在选择窗口上传。图片会按页面大小居中裁切。</Text>
      </div>}

      <div className="appearance-control-group">
        <Flex justify="space-between"><Text strong>登录卡片透明度</Text><Text>{draft.cardOpacity}%</Text></Flex>
        <Slider min={30} max={100} value={draft.cardOpacity} onChange={(cardOpacity) => change({ cardOpacity })} />
        <Text type="secondary" style={{ fontSize: 12 }}>只调整卡片背景，表单文字和控件保持清晰。</Text>
      </div>
    </div>

    <div className="appearance-preview" style={loginBackgroundStyle(draft)}>
      <div className="appearance-preview-card" style={loginCardStyle(draft)}>
        <div className="appearance-preview-mark" />
        <strong>登录效果预览</strong>
        <span>管理后台</span>
        <div className="appearance-preview-input" />
        <div className="appearance-preview-input" />
        <div className="appearance-preview-button" />
      </div>
    </div>
    <FilePickerModal open={pickerOpen} accept={['image/png', 'image/jpeg', 'image/webp', 'image/gif']}
      onCancel={() => setPickerOpen(false)} onConfirm={selectBackground} />
  </Card>;
}
