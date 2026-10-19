import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Flex, Input, message, Modal, Pagination, Space, Spin, Typography, Upload } from 'antd';
import { Search, UploadCloud } from 'lucide-react';
import type { FileItem, FileQuery } from '../../api/files';
import { uploadFile } from '../../api/files';
import { acceptsMime } from './fileUtils';
import { FileGrid } from './FileGrid';
import { useFileLibrary } from './useFileLibrary';

const { Text } = Typography;

export interface FilePickerModalProps {
  open: boolean;
  multiple?: boolean;
  accept?: string[];
  onCancel: () => void;
  onConfirm: (files: FileItem[]) => void;
}

export function FilePickerModal({ open, multiple = false, accept, onCancel, onConfirm }: FilePickerModalProps) {
  const mimeKey = accept?.join(',') ?? '';
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<FileQuery>({ page: 1, pageSize: 20, mimeTypes: accept });
  const [selected, setSelected] = useState<Map<string, FileItem>>(new Map());
  const [uploading, setUploading] = useState(false);
  const pendingUploads = useRef(0);
  const { result, loading, error, reload } = useFileLibrary(query, open);
  const visibleItems = useMemo(() => result.items.filter((item) => acceptsMime(item.mimeType, accept)), [result.items, accept]);

  useEffect(() => {
    if (open) return;
    setSelected(new Map());
    setSearchDraft('');
    setQuery({ page: 1, pageSize: 20, mimeTypes: accept });
  }, [open]);

  useEffect(() => {
    setQuery((current) => ({ ...current, page: 1, mimeTypes: mimeKey ? mimeKey.split(',') : undefined }));
  }, [mimeKey]);

  const select = (file: FileItem) => {
    setSelected((current) => {
      if (!multiple) return current.has(file.id) ? new Map() : new Map([[file.id, file]]);
      const next = new Map(current);
      if (next.has(file.id)) next.delete(file.id);
      else next.set(file.id, file);
      return next;
    });
  };

  const handleUpload = async (file: File) => {
    const mimeType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon' : file.type;
    if (!acceptsMime(mimeType, accept)) {
      message.error('文件类型不符合当前选择要求');
      return;
    }
    pendingUploads.current += 1;
    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (!response.success) throw new Error(response.msg);
      setSelected((current) => multiple ? new Map(current).set(response.data.id, response.data)
        : new Map([[response.data.id, response.data]]));
      message.success('上传成功，已选中该文件');
      if (query.page === 1 && !query.search) void reload();
      else {
        setSearchDraft('');
        setQuery({ page: 1, pageSize: 20, mimeTypes: accept });
      }
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '上传失败');
    } finally {
      pendingUploads.current -= 1;
      if (pendingUploads.current === 0) setUploading(false);
    }
  };

  const search = () => setQuery((current) => ({ ...current, page: 1, search: searchDraft.trim() || undefined }));

  return (
    <Modal title={multiple ? '选择文件（多选）' : '选择文件'} open={open} onCancel={onCancel}
      width={920} destroyOnClose={false} okText={`确定${selected.size ? `（${selected.size}）` : ''}`}
      okButtonProps={{ disabled: selected.size === 0, loading: uploading }}
      onOk={() => onConfirm(Array.from(selected.values()))}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: 320, maxWidth: '100%' }}>
          <Input placeholder="搜索文件名" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)}
            onPressEnter={search} allowClear />
          <Button icon={<Search size={16} />} onClick={search}>搜索</Button>
        </Space.Compact>
        <Upload showUploadList={false} multiple={multiple}
          accept={accept?.includes('image/x-icon') ? `${accept.join(',')},.ico` : accept?.join(',')}
          beforeUpload={(file) => { void handleUpload(file); return false; }}>
          <Button type="primary" icon={<UploadCloud size={16} />} loading={uploading} disabled={uploading}>上传新文件</Button>
        </Upload>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Spin spinning={loading}>
        <div style={{ minHeight: 295, maxHeight: 480, overflowY: 'auto', padding: 3 }}>
          <FileGrid items={visibleItems} selectedIds={new Set(selected.keys())} onSelect={select} />
        </div>
      </Spin>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginTop: 16 }}>
        <Text type="secondary">已选择 {selected.size} 个文件{accept?.length ? ' · 仅显示符合类型的文件' : ''}</Text>
        <Pagination size="small" current={query.page} pageSize={query.pageSize} total={result.total}
          onChange={(page) => setQuery((current) => ({ ...current, page }))} showSizeChanger={false} />
      </Flex>
    </Modal>
  );
}
