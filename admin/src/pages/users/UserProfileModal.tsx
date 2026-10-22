import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Form, Input, Modal, Space, Typography } from 'antd';
import { UserRound } from 'lucide-react';
import type { UserItem, UserProfileInput } from '../../api/users';
import { FilePickerModal } from '../../components/file-picker/FilePickerModal';

interface Props {
  user: UserItem | null;
  onClose: () => void;
  onSave: (id: number, input: UserProfileInput) => Promise<void>;
}

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon'];

export function UserProfileModal({ user, onClose, onSave }: Props) {
  const [form] = Form.useForm<Pick<UserProfileInput, 'nickname'>>();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({ nickname: user.nickname });
    setAvatar(user.avatar);
    setError(null);
  }, [form, user]);

  const close = () => {
    if (saving) return;
    setPickerOpen(false);
    setError(null);
    onClose();
  };

  const submit = async (values: Pick<UserProfileInput, 'nickname'>) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(user.id, { nickname: values.nickname.trim(), avatar });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存用户资料失败');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Modal title="编辑用户资料" open={user !== null} onCancel={close} onOk={() => form.submit()}
      okText="保存" cancelText="取消" confirmLoading={saving} cancelButtonProps={{ disabled: saving }}
      maskClosable={!saving} destroyOnHidden width={560}>
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
      <Form form={form} layout="vertical" onFinish={(values) => void submit(values)} style={{ marginTop: 20 }}>
        <Form.Item label="头像">
          <Space align="center" size={16}>
            <Avatar size={72} src={avatar || undefined} icon={<UserRound size={32} />} />
            <Space direction="vertical" size={6}>
              <Space>
                <Button onClick={() => setPickerOpen(true)}>从文件库选择</Button>
                <Button disabled={!avatar} onClick={() => setAvatar(null)}>移除头像</Button>
              </Space>
              <Typography.Text type="secondary">支持 PNG、JPEG、WebP、GIF、ICO，可在文件库上传新图片。</Typography.Text>
            </Space>
          </Space>
        </Form.Item>
        <Form.Item name="nickname" label="昵称" rules={[
          { required: true, whitespace: true, message: '请输入昵称' },
          { max: 50, message: '昵称最多 50 个字符' },
        ]}>
          <Input maxLength={50} placeholder="请输入昵称" />
        </Form.Item>
      </Form>
    </Modal>
    <FilePickerModal open={pickerOpen} accept={imageMimeTypes}
      onCancel={() => setPickerOpen(false)}
      onConfirm={(files) => {
        if (files[0]) setAvatar(files[0].url);
        setPickerOpen(false);
      }} />
  </>;
}
