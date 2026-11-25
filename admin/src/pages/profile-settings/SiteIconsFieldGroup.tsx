import { useState } from 'react';
import { Button, Col, Flex, Popconfirm, Row, Space, Typography, message } from 'antd';
import { Globe2, ImageUp, Trash2 } from 'lucide-react';
import type { FileItem } from '../../api/files';
import { deleteSiteIcon, selectSiteIcon, type SiteTarget } from '../../api/siteSettings';
import { SiteIcon } from '../../components/SiteIcon';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';
import { useSiteSettings } from '../../site-settings/SiteSettingsContext';

const { Text } = Typography;
const ICON_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon'];

interface IconSlotProps {
  target: SiteTarget;
  title: string;
  description: string;
  iconUrl: string | null;
  busy: boolean;
  onSelect: (target: SiteTarget) => void;
  onDelete: (target: SiteTarget) => void;
}

function IconSlot({ target, title, description, iconUrl, busy, onSelect, onDelete }: IconSlotProps) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
        <Globe2 size={16} color="#2563eb" />
        <Text strong>{title}</Text>
      </Flex>
      <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>
      <Flex align="center" gap={14} wrap="wrap" style={{ marginTop: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <SiteIcon url={iconUrl} size={32} />
        </div>
        <Space size={8}>
          <Button icon={<ImageUp size={15} />} loading={busy} onClick={() => onSelect(target)}>
            {iconUrl ? '更换图标' : '选择图标'}
          </Button>
          {iconUrl ? (
            <Popconfirm title="移除系统图标？" okText="移除" cancelText="取消" onConfirm={() => onDelete(target)}>
              <Button danger icon={<Trash2 size={15} />} disabled={busy}>移除</Button>
            </Popconfirm>
          ) : null}
        </Space>
      </Flex>
    </div>
  );
}

/**
 * 统一管理前台网站图标与管理后台图标（即时持久化并同步 SiteSettingsContext）。
 */
export function SiteIconsFieldGroup() {
  const { settings, setSettings } = useSiteSettings();
  const [pickerTarget, setPickerTarget] = useState<SiteTarget | null>(null);
  const [busyTarget, setBusyTarget] = useState<SiteTarget | null>(null);

  const handleSelectIcon = async (target: SiteTarget, file: FileItem) => {
    setPickerTarget(null);
    if (file.size > 2 * 1024 * 1024) {
      message.error('图标不能超过 2 MB');
      return;
    }
    setBusyTarget(target);
    try {
      const res = await selectSiteIcon(target, file.id);
      if (!res.success) throw new Error(res.msg);
      setSettings(res.data);
      message.success(target === 'client' ? '前台网站图标已更新' : '管理后台图标已更新');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '更新图标失败');
    } finally {
      setBusyTarget(null);
    }
  };

  const handleDeleteIcon = async (target: SiteTarget) => {
    setBusyTarget(target);
    try {
      const res = await deleteSiteIcon(target);
      if (!res.success) throw new Error(res.msg);
      setSettings(res.data);
      message.success('图标已移除');
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '移除图标失败');
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <IconSlot
            target="client"
            title="前台网站图标（左上角 & 浏览器标签 Favicon）"
            description="支持 PNG、JPG、WebP、ICO，最大 2 MB。"
            iconUrl={settings.client.iconUrl}
            busy={busyTarget === 'client'}
            onSelect={setPickerTarget}
            onDelete={(target) => void handleDeleteIcon(target)}
          />
        </Col>
        <Col xs={24} md={12}>
          <IconSlot
            target="admin"
            title="管理后台图标（登录页、后台侧栏 & 标签页）"
            description="支持 PNG、JPG、WebP、ICO，最大 2 MB。"
            iconUrl={settings.admin.iconUrl}
            busy={busyTarget === 'admin'}
            onSelect={setPickerTarget}
            onDelete={(target) => void handleDeleteIcon(target)}
          />
        </Col>
      </Row>

      <FilePickerModal
        open={pickerTarget !== null}
        multiple={false}
        accept={ICON_ACCEPT}
        onCancel={() => setPickerTarget(null)}
        onConfirm={(files) => {
          if (pickerTarget && files[0]) void handleSelectIcon(pickerTarget, files[0]);
        }}
      />
    </>
  );
}
