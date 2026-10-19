import { Descriptions, Modal, Typography } from 'antd';
import type { RequestLogItem } from '../../api/requestLogs';
import { formatDateTime } from '../../utils/dateTime';

const { Text } = Typography;

function formatBody(value: string | null): string {
  if (!value) return '—';
  try {
    return JSON.stringify(JSON.parse(value) as unknown, null, 2);
  } catch {
    return value;
  }
}

function DetailBody({ title, value }: { title: string; value: string | null }) {
  return (
    <section style={{ marginTop: 20 }}>
      <Text strong>{title}</Text>
      <pre style={{ margin: '8px 0 0', padding: 16, borderRadius: 8, background: '#f8fafc',
        whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 320, overflow: 'auto' }}>{formatBody(value)}</pre>
    </section>
  );
}

interface Props {
  item: RequestLogItem | null;
  onClose: () => void;
}

export function RequestLogDetail({ item, onClose }: Props) {
  return (
    <Modal title="请求日志详情" open={item !== null} onCancel={onClose} footer={null} width={760} destroyOnClose>
      {item && (
        <>
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="记录时间">{formatDateTime(item.time)}</Descriptions.Item>
            <Descriptions.Item label="响应状态">{item.status}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{item.method}</Descriptions.Item>
            <Descriptions.Item label="耗时">{item.durationMs} ms</Descriptions.Item>
            <Descriptions.Item label="完整地址" span={2}>{item.url}</Descriptions.Item>
            <Descriptions.Item label="IP">{item.ip || '—'}</Descriptions.Item>
            <Descriptions.Item label="Origin">{item.origin || '—'}</Descriptions.Item>
            <Descriptions.Item label="Referer" span={2}>{item.referer || '—'}</Descriptions.Item>
            <Descriptions.Item label="User-Agent" span={2}>{item.userAgent || '—'}</Descriptions.Item>
          </Descriptions>
          <DetailBody title="请求参数" value={item.requestData} />
          <DetailBody title="响应内容" value={item.responseData} />
        </>
      )}
    </Modal>
  );
}
