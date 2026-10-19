import { useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Image, Input, message, Modal, Space, Table, Typography, Upload } from 'antd';
import type { TableProps } from 'antd';
import { Copy, FolderOpen, Search, Trash2, UploadCloud } from 'lucide-react';
import type { FileItem, FileQuery } from '../../api/files';
import { archiveFile, uploadFile } from '../../api/files';
import { formatFileSize, isImage } from '../../components/file-picker/fileUtils';
import { useFileLibrary } from '../../components/file-picker/useFileLibrary';

const { Title, Text, Paragraph } = Typography;

export function FilesPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<FileQuery>({ page: 1, pageSize: 20 });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const { result, loading, error, reload } = useFileLibrary(query);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (!response.success) throw new Error(response.msg);
      message.success('文件已上传到文件管理器');
      if (query.page === 1 && !query.search) void reload();
      else {
        setSearchDraft('');
        setQuery({ page: 1, pageSize: 20 });
      }
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (file: FileItem) => {
    try {
      await navigator.clipboard.writeText(new URL(file.url, window.location.origin).toString());
      message.success('文件链接已复制');
    } catch {
      message.error('复制失败，请检查浏览器剪贴板权限');
    }
  };

  const confirmArchive = (file: FileItem) => {
    Modal.confirm({
      title: '从文件管理器归档？',
      content: `归档「${file.name}」后将不再出现在文件列表中，已使用的链接仍可访问。`,
      okText: '归档', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const response = await archiveFile(file.id);
          if (!response.success) throw new Error(response.msg);
          message.success('文件已归档');
          if (result.items.length === 1 && query.page > 1) {
            setQuery((current) => ({ ...current, page: current.page - 1 }));
          } else {
            await reload();
          }
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '归档失败');
          throw cause;
        }
      },
    });
  };

  const columns = useMemo<TableProps<FileItem>['columns']>(() => [
    { title: '预览', width: 96, key: 'preview', render: (_, file) => isImage(file)
      ? <Image src={file.url} alt={file.name} width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} />
      : <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f1f5f9', display: 'grid', placeItems: 'center' }}><FolderOpen size={24} color="#94a3b8" /></div> },
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true,
      render: (name: string, file) => <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => setPreview(file)}>{name}</Button> },
    { title: '类型', dataIndex: 'mimeType', key: 'mimeType', width: 190, ellipsis: true },
    { title: '大小', dataIndex: 'size', key: 'size', width: 110, render: formatFileSize },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 190,
      render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '操作', key: 'actions', width: 190, render: (_, file) => <Space size={0}>
      <Button type="link" size="small" icon={<Copy size={14} />} onClick={() => void copyUrl(file)}>复制链接</Button>
      <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => confirmArchive(file)}>归档</Button>
    </Space> },
  ], [reload, query.page, result.items.length]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><FolderOpen size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>素材资源</Text></Space>
          <Title level={2} style={{ margin: 0 }}>文件管理</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>集中管理上传文件，复用已有文件链接。</Paragraph>
        </div>
        <Upload showUploadList={false} multiple beforeUpload={(file) => { void handleUpload(file); return false; }}>
          <Button type="primary" icon={<UploadCloud size={16} />} loading={uploading}>上传文件</Button>
        </Upload>
      </Flex>
      <Card style={{ marginBottom: 16, borderRadius: 16 }}>
        <Space.Compact style={{ width: 360, maxWidth: '100%' }}>
          <Input placeholder="搜索文件名" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)}
            onPressEnter={() => setQuery((current) => ({ ...current, page: 1, search: searchDraft.trim() || undefined }))} allowClear />
          <Button icon={<Search size={16} />} onClick={() => setQuery((current) => ({ ...current, page: 1, search: searchDraft.trim() || undefined }))}>搜索</Button>
        </Space.Compact>
      </Card>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<FileItem> rowKey="id" columns={columns} dataSource={result.items} loading={loading} scroll={{ x: 'max-content' }}
          pagination={{ current: query.page, pageSize: query.pageSize, total: result.total, showSizeChanger: true,
            pageSizeOptions: [10, 20, 50], showTotal: (total) => `共 ${total} 个文件`,
            onChange: (page, pageSize) => setQuery((current) => ({ ...current, page, pageSize })) }} />
      </Card>
      <Modal title={preview?.name || '文件预览'} open={preview !== null} footer={null} onCancel={() => setPreview(null)}>
        {preview && <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {isImage(preview) ? <Image src={preview.url} alt={preview.name} style={{ maxHeight: 420, objectFit: 'contain' }} />
            : <Text>该文件不支持在线预览，可通过链接打开。</Text>}
          <Text copyable={{ text: new URL(preview.url, window.location.origin).toString() }} ellipsis>{preview.url}</Text>
        </Space>}
      </Modal>
    </div>
  );
}
