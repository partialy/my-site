import { Card, Empty, Typography } from 'antd';
import { File as FileIcon } from 'lucide-react';
import type { FileItem } from '../../api/files';
import { formatFileSize, isImage } from './fileUtils';

const { Text } = Typography;

interface FileGridProps {
  items: FileItem[];
  selectedIds: Set<string>;
  onSelect: (file: FileItem) => void;
}

export function FileGrid({ items, selectedIds, onSelect }: FileGridProps) {
  if (!items.length) return <Empty description="暂无文件，可在上方上传" style={{ padding: 42 }} />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: 12 }}>
      {items.map((file) => {
        const selected = selectedIds.has(file.id);
        return (
          <Card key={file.id} hoverable size="small" onClick={() => onSelect(file)}
            style={{ borderRadius: 12, borderColor: selected ? '#1677ff' : undefined,
              boxShadow: selected ? '0 0 0 2px #1677ff33' : undefined }}
            styles={{ body: { padding: 8 } }}>
            <div style={{ height: 108, borderRadius: 8, background: '#f4f7fb', display: 'flex',
              justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
              {isImage(file) ? <img src={file.url} alt={file.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FileIcon size={32} color="#789" />}
              {selected && <span style={{ position: 'absolute', right: 6, top: 6, color: '#fff', background: '#1677ff',
                borderRadius: 12, width: 20, height: 20, textAlign: 'center', lineHeight: '20px', fontSize: 12 }}>✓</span>}
            </div>
            <Text ellipsis={{ tooltip: file.name }} style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{file.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{formatFileSize(file.size)}</Text>
          </Card>
        );
      })}
    </div>
  );
}
