import { useState } from 'react';
import { DatePicker, InputNumber, Modal, Select, Typography } from 'antd';
import type { RequestLogCleanup } from '../../api/requestLogs';

type RuleMode = Exclude<RequestLogCleanup['mode'], 'ids'>;

const modeOptions: { label: string; value: RuleMode }[] = [
  { label: '指定时间段', value: 'timeRange' },
  { label: '某个时间前', value: 'beforeTime' },
  { label: '某个时间后', value: 'afterTime' },
  { label: '保留最新 N 条', value: 'keepLatest' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: RequestLogCleanup) => Promise<void>;
}

export function RequestLogCleanupModal({ open, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<RuleMode>('timeRange');
  const [range, setRange] = useState<[string, string] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const input: RequestLogCleanup | null = mode === 'timeRange'
    ? range ? { mode, startTime: range[0], endTime: range[1] } : null
    : mode === 'keepLatest'
      ? count !== null && Number.isInteger(count) && count >= 1 && count <= 1_000_000 ? { mode, count } : null
      : time ? { mode, time: mode === 'afterTime'
        ? new Date(Date.parse(time) + 999).toISOString() : time } : null;

  const reset = () => {
    setMode('timeRange');
    setRange(null);
    setTime(null);
    setCount(null);
  };

  const close = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const confirm = async () => {
    if (!input) return;
    setLoading(true);
    try {
      await onConfirm(input);
      reset();
      onClose();
    } catch {
      // 错误消息由调用方展示，保留弹窗供用户重试。
    } finally {
      setLoading(false);
    }
  };

  return <Modal title="清理请求日志" open={open} onCancel={close} onOk={() => void confirm()}
    okText="确认清理" okType="danger" okButtonProps={{ disabled: !input }} confirmLoading={loading}
    cancelButtonProps={{ disabled: loading }} destroyOnHidden>
    <Typography.Paragraph type="secondary">清理作用于全部请求日志，不受当前列表筛选影响，删除后无法恢复。</Typography.Paragraph>
    <Select<RuleMode> value={mode} options={modeOptions} style={{ width: '100%', marginBottom: 16 }}
      onChange={setMode} aria-label="清理方式" />
    {mode === 'timeRange' && <>
      <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }}
        onChange={(dates) => setRange(dates?.[0] && dates?.[1]
          ? [dates[0].toISOString(), dates[1].endOf('second').toISOString()] : null)} />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>按本地时间选择，起止秒均包含在内。</Typography.Paragraph>
    </>}
    {(mode === 'beforeTime' || mode === 'afterTime') && <>
      <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }}
        onChange={(value) => setTime(value ? value.startOf('second').toISOString() : null)} />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
        删除所选本地时间整秒{mode === 'beforeTime' ? '之前' : '之后'}的日志，不包含该秒。
      </Typography.Paragraph>
    </>}
    {mode === 'keepLatest' && <>
      <InputNumber min={1} max={1_000_000} precision={0} value={count} onChange={setCount}
        placeholder="输入要保留的最新日志条数" style={{ width: '100%' }} />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>按写入顺序保留最新 N 条，其余全部删除。</Typography.Paragraph>
    </>}
  </Modal>;
}
