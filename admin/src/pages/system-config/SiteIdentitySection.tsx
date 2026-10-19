import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Flex, Input, Popconfirm, Row, Space, Typography, message } from 'antd';
import { Globe2, ImageUp, Save, Trash2 } from 'lucide-react';
import { deleteSiteIcon, selectSiteIcon, updateSiteSettings } from '../../api/siteSettings';
import type { SiteSettingsInput, SiteTarget } from '../../api/siteSettings';
import { SiteIcon } from '../../components/SiteIcon';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';
import type { FileItem } from '../../api/files';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';

const { Text, Title } = Typography;

interface SiteIdentityFieldsProps {
  target: SiteTarget;
  title: string;
  description: string;
  siteTitle: string;
  systemName: string;
  iconUrl: string | null;
  busy: boolean;
  onFieldChange: (target: SiteTarget, field: 'siteTitle' | 'systemName', value: string) => void;
  onSelect: (target: SiteTarget) => void;
  onDelete: (target: SiteTarget) => void;
}

function SiteIdentityFields(props: SiteIdentityFieldsProps) {
  const { target, title, description, siteTitle, systemName, iconUrl, busy, onFieldChange, onSelect, onDelete } = props;

  return (
    <div className="site-identity-panel">
      <Flex align="center" gap={10} style={{ marginBottom: 4 }}>
        <div className="system-config-small-icon"><Globe2 size={18} /></div>
        <Title level={5} style={{ margin: 0 }}>{title}</Title>
      </Flex>
      <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>

      <div className="site-identity-fields">
        <label>
          <Text strong>网站标签名称</Text>
          <Input value={siteTitle} maxLength={100} onChange={(event) => onFieldChange(target, 'siteTitle', event.target.value)} placeholder="显示在浏览器标签上" />
        </label>
        <label>
          <Text strong>系统名称</Text>
          <Input value={systemName} maxLength={100} onChange={(event) => onFieldChange(target, 'systemName', event.target.value)} placeholder="显示在系统页面中" />
        </label>
        <div>
          <Text strong>系统图标</Text>
          <Flex align="center" gap={14} wrap="wrap" style={{ marginTop: 10 }}>
            <div className="site-identity-icon"><SiteIcon url={iconUrl} size={32} /></div>
            <Space size={8}>
              <Button icon={<ImageUp size={15} />} loading={busy} onClick={() => onSelect(target)}>
                {iconUrl ? '更换图标' : '选择图标'}
              </Button>
              {iconUrl && (
                <Popconfirm title="移除系统图标？" okText="移除" cancelText="取消" onConfirm={() => onDelete(target)}>
                  <Button danger icon={<Trash2 size={15} />} disabled={busy}>移除</Button>
                </Popconfirm>
              )}
            </Space>
          </Flex>
          <Text type="secondary" style={{ fontSize: 12 }}>从文件管理器选择，也可在选择窗口上传。支持 PNG、JPG、WebP、ICO，最大 2 MB。</Text>
        </div>
      </div>
    </div>
  );
}

export function SiteIdentitySection() {
  const { settings, setSettings } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettingsInput>({
    admin: { siteTitle: settings.admin.siteTitle, systemName: settings.admin.systemName },
    client: { siteTitle: settings.client.siteTitle, systemName: settings.client.systemName },
  });
  const [saving, setSaving] = useState(false);
  const [busyTarget, setBusyTarget] = useState<SiteTarget | null>(null);
  const [pickerTarget, setPickerTarget] = useState<SiteTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      admin: { siteTitle: settings.admin.siteTitle, systemName: settings.admin.systemName },
      client: { siteTitle: settings.client.siteTitle, systemName: settings.client.systemName },
    });
  }, [settings.admin.siteTitle, settings.admin.systemName, settings.client.siteTitle, settings.client.systemName]);

  const dirty = draft.admin.siteTitle !== settings.admin.siteTitle ||
    draft.admin.systemName !== settings.admin.systemName ||
    draft.client.siteTitle !== settings.client.siteTitle ||
    draft.client.systemName !== settings.client.systemName;

  const changeField = (target: SiteTarget, field: 'siteTitle' | 'systemName', value: string) => {
    setDraft((current) => ({ ...current, [target]: { ...current[target], [field]: value } }));
  };

  const save = async () => {
    const input: SiteSettingsInput = {
      admin: { siteTitle: draft.admin.siteTitle.trim(), systemName: draft.admin.systemName.trim() },
      client: { siteTitle: draft.client.siteTitle.trim(), systemName: draft.client.systemName.trim() },
    };
    if (Object.values(input).some((item) => !item.siteTitle || !item.systemName)) {
      setError('网站标签名称和系统名称不能为空');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateSiteSettings(input);
      if (!result.success) throw new Error(result.msg);
      setSettings(result.data);
      message.success('网站信息已保存');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存网站信息失败');
    } finally {
      setSaving(false);
    }
  };

  const selectIcon = async (target: SiteTarget, file: FileItem) => {
    setPickerTarget(null);
    if (file.size > 2 * 1024 * 1024) {
      message.error('图标不能超过 2 MB');
      return;
    }
    setBusyTarget(target);
    setError(null);
    try {
      const result = await selectSiteIcon(target, file.id);
      if (!result.success) throw new Error(result.msg);
      setSettings(result.data);
      message.success('图标已更新');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '更新图标失败');
    } finally {
      setBusyTarget(null);
    }
  };

  const remove = async (target: SiteTarget) => {
    setBusyTarget(target);
    setError(null);
    try {
      const result = await deleteSiteIcon(target);
      if (!result.success) throw new Error(result.msg);
      setSettings(result.data);
      message.success('图标已移除');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '移除图标失败');
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <Card styles={{ body: { padding: 28 } }} style={{ borderRadius: 16 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: '0 0 5px' }}>网站信息</Title>
          <Text type="secondary">分别设置管理后台与前台项目的标签名称、系统名称和图标。</Text>
        </div>
        <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={!dirty} onClick={() => void save()}>保存网站信息</Button>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <SiteIdentityFields target="admin" title="管理后台" description="用于登录页、后台侧栏和浏览器标签" {...draft.admin} iconUrl={settings.admin.iconUrl} busy={busyTarget === 'admin'} onFieldChange={changeField} onSelect={setPickerTarget} onDelete={(target) => void remove(target)} />
        </Col>
        <Col xs={24} lg={12}>
          <SiteIdentityFields target="client" title="前台项目" description="保留给后续 client 项目读取与展示" {...draft.client} iconUrl={settings.client.iconUrl} busy={busyTarget === 'client'} onFieldChange={changeField} onSelect={setPickerTarget} onDelete={(target) => void remove(target)} />
        </Col>
      </Row>
      <FilePickerModal
        open={pickerTarget !== null}
        multiple={false}
        accept={['image/png', 'image/jpeg', 'image/webp', 'image/x-icon']}
        onCancel={() => setPickerTarget(null)}
        onConfirm={(files) => {
          if (pickerTarget && files[0]) void selectIcon(pickerTarget, files[0]);
        }}
      />
    </Card>
  );
}
