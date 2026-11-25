import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Flex, Input, message, Modal, Pagination, Space, Spin, Typography, Upload } from 'antd';
import { Search, UploadCloud } from 'lucide-react';
import type { FileItem } from '../../api/files';
import { batchUploadFiles } from '../../api/files';
import { acceptsMime } from './fileUtils';
import { FileGrid } from './FileGrid';
import { useFileLibrary, type FileLibraryQuery } from './useFileLibrary';

const { Text } = Typography;

export interface FilePickerModalProps {
  open: boolean;
  multiple?: boolean;
  accept?: string[];
  zIndex?: number;
  onCancel: () => void;
  onConfirm: (files: FileItem[]) => void;
}

export function FilePickerModal({ open, multiple = false, accept, zIndex = 1200, onCancel, onConfirm }: FilePickerModalProps) {
  const mimeKey = accept?.join(',') ?? '';
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<FileLibraryQuery>({ page: 1, pageSize: 20, mimeTypes: accept, status: 'active' });
  const [selected, setSelected] = useState<Map<string, FileItem>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const { result, loading, error, reload } = useFileLibrary(query, open);
  const uploading = uploadProgress !== null;
  const visibleItems = useMemo(() => result.list.filter((item) => acceptsMime(item.mimeType, accept)), [result.list, accept]);

  useEffect(() => {
    if (open) return;
    setSelected(new Map());
    setSearchDraft('');
    setQuery({ page: 1, pageSize: 20, mimeTypes: accept, status: 'active' });
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

  const handleBatchUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadProgress({ done: 0, total: files.length });
    try {
      const { uploaded, failed } = await batchUploadFiles(files, {
        validateFile: (file) => {
          const mimeType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon' : file.type;
          return acceptsMime(mimeType, accept) ? null : '文件类型不符合当前选择要求';
        },
        onProgress: (done, total) => setUploadProgress({ done, total }),
      });

      if (uploaded.length > 0) {
        setSelected((current) => {
          if (!multiple) {
            const picked = uploaded[uploaded.length - 1]!;
            return new Map([[picked.id, picked]]);
          }
          const next = new Map(current);
          uploaded.forEach((item) => next.set(item.id, item));
          return next;
        });
        message.success(
          uploaded.length === 1
            ? '上传成功，已选中该文件'
            : multiple
              ? `已批量上传并选中 ${uploaded.length} 个文件`
              : `已批量上传 ${uploaded.length} 个文件，并自动选中最新文件`,
        );
        if (query.page === 1 && !query.search) void reload();
        else {
          setSearchDraft('');
          setQuery({ page: 1, pageSize: 20, mimeTypes: accept, status: 'active' });
        }
      }
      if (failed.length > 0) {
        message.warning(`${failed.length} 个文件上传跳过或失败（如 ${failed[0]!.name}：${failed[0]!.reason}）`);
      }
    } finally {
      setUploadProgress(null);
    }
  };

  const search = () => setQuery((current) => ({ ...current, page: 1, search: searchDraft.trim() || undefined }));

  return (
    <Modal title={multiple ? '选择文件（多选）' : '选择文件'} open={open} onCancel={onCancel}
      width={920} zIndex={zIndex} destroyOnClose={false} okText={`确定${selected.size ? `（${selected.size}）` : ''}`}
      okButtonProps={{ disabled: selected.size === 0, loading: uploading }}
      onOk={() => onConfirm(Array.from(selected.values()))}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: 320, maxWidth: '100%' }}>
          <Input placeholder="搜索文件名" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)}
            onPressEnter={search} allowClear />
          <Button icon={<Search size={16} />} onClick={search}>搜索</Button>
        </Space.Compact>
        <Upload
          showUploadList={false}
          multiple
          accept={accept?.includes('image/x-icon') ? `${accept.join(',')},.ico` : accept?.join(',')}
          beforeUpload={(file, fileList) => {
            if (file === fileList[0]) void handleBatchUpload(fileList);
            return false;
          }}
        >
          <Button type="primary" icon={<UploadCloud size={16} />} loading={uploading} disabled={uploading}>
            {uploadProgress ? `上传中 (${uploadProgress.done}/${uploadProgress.total})` : '批量上传文件'}
          </Button>
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
