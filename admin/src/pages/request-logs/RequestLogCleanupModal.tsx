import { useState } from 'react';
import { DatePicker, Modal, Typography } from 'antd';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
}

export function RequestLogCleanupModal({ open, onClose, onConfirm }: Props) {
  const [range, setRange] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(false);

  const close = () => {
    if (loading) return;
    setRange(null);
    onClose();
  };

  const confirm = async () => {
    if (!range) return;
    setLoading(true);
    try {
      await onConfirm(...range);
      setRange(null);
      onClose();
    } catch {
      // 错误消息由调用方展示，保留弹窗供用户重试。
    } finally {
      setLoading(false);
    }
  };

  return <Modal title="按时间段清理请求日志" open={open} onCancel={close} onOk={() => void confirm()}
    okText="确认清理" okType="danger" okButtonProps={{ disabled: !range }} confirmLoading={loading}
    cancelButtonProps={{ disabled: loading }} destroyOnHidden>
    <Typography.Paragraph type="secondary">选择本地时间的起止范围，范围内的日志将永久删除。结束秒包含在内。</Typography.Paragraph>
    <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }}
      onChange={(dates) => setRange(dates?.[0] && dates?.[1]
        ? [dates[0].toISOString(), dates[1].endOf('second').toISOString()] : null)} />
  </Modal>;
}
