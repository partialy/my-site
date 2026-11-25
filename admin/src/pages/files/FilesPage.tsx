import { useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Image, message, Modal, Space, Table, Tag, Typography, Upload } from 'antd';
import type { TableProps } from 'antd';
import { Link } from 'react-router-dom';
import { Archive, Copy, FolderOpen, RotateCcw, Trash2, UploadCloud } from 'lucide-react';
import type { FileItem } from '../../api/files';
import {
  archiveFile,
  batchDeleteFiles,
  batchUploadFiles,
  deleteFilePermanently,
  restoreFile,
} from '../../api/files';
import { CrudFilterBar, type CrudFilterField } from '../../components/crud/CrudFilterBar';
import { formatFileSize, isImage } from '../../components/file-picker/fileUtils';
import { defaultFileFilters, useFilesPage, type FileFilters } from './useFilesPage';

const { Title, Text, Paragraph } = Typography;
const filterFields: ReadonlyArray<CrudFilterField<FileFilters>> = [
  { key: 'search', kind: 'text', placeholder: '搜索文件名', width: 360 },
  { key: 'status', kind: 'select', placeholder: '归档状态', width: 150, options: [
    { label: '全部文件', value: 'all' }, { label: '可用', value: 'active' }, { label: '已归档', value: 'archived' },
  ] },
];

export function FilesPage() {
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const { query, result, loading, error, reload, setFilters, resetFilters, setPage } = useFilesPage();
  const uploading = uploadProgress !== null;

  const handleBatchUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadProgress({ done: 0, total: files.length });
    try {
      const { uploaded, failed } = await batchUploadFiles(files, {
        onProgress: (done, total) => setUploadProgress({ done, total }),
      });
      if (uploaded.length > 0) {
        message.success(
          failed.length > 0
            ? `已上传 ${uploaded.length} 个文件，${failed.length} 个失败`
            : uploaded.length === 1
              ? '文件已上传到文件管理器'
              : `已批量上传 ${uploaded.length} 个文件`,
        );
        if (query.page === 1 && !query.search && query.status !== 'archived') reload();
        else setFilters({ ...query, search: undefined, status: 'all' });
      }
      if (failed.length > 0) {
        Modal.warning({
          title: `有 ${failed.length} 个文件上传失败`,
          content: (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {failed.map((item, idx) => <li key={idx}>{item.name}：{item.reason}</li>)}
            </ul>
          ),
        });
      }
    } finally {
      setUploadProgress(null);
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
      title: '归档文件？',
      content: `归档「${file.name}」后仍可在文件管理中查看和恢复，但不会出现在文件选择器中；已有链接仍可访问。`,
      okText: '归档', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const response = await archiveFile(file.id);
          if (!response.success) throw new Error(response.msg);
          message.success('文件已归档');
          if (query.status === 'active' && result.list.length === 1 && query.page > 1) {
            setPage(query.page - 1, query.pageSize);
          } else {
            reload();
          }
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '归档失败');
          throw cause;
        }
      },
    });
  };

  const confirmRestore = (file: FileItem) => {
    Modal.confirm({
      title: '恢复文件？',
      content: `恢复「${file.name}」后，它会重新出现在文件选择器中。`,
      okText: '恢复', cancelText: '取消',
      onOk: async () => {
        try {
          const response = await restoreFile(file.id);
          if (!response.success) throw new Error(response.msg);
          message.success('文件已恢复');
          if (query.status === 'archived' && result.list.length === 1 && query.page > 1) {
            setPage(query.page - 1, query.pageSize);
          } else reload();
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '恢复失败');
          throw cause;
        }
      },
    });
  };

  const confirmDelete = (file: FileItem) => {
    Modal.confirm({
      title: '永久删除文件？',
      content: `将删除「${file.name}」的文件和记录，原链接会立即失效。系统会拦截当前站点图标；业务页面或外部保存的链接无法自动检测，请确认不再使用。`,
      okText: '永久删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteFilePermanently(file.id);
          if (!response.success) throw new Error(response.msg);
          setSelectedRowKeys((keys) => keys.filter((id) => id !== file.id));
          message.success('文件已永久删除');
          if (result.list.length === 1 && query.page > 1) setPage(query.page - 1, query.pageSize);
          else reload();
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '删除失败');
          throw cause;
        }
      },
    });
  };

  const confirmBatchDelete = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: `永久删除选中的 ${selectedRowKeys.length} 个文件？`,
      content: '删除后文件和记录将无法恢复，原访问链接立即失效；正在用作站点图标、登录背景、作品封面或轮盘图标的文件将被自动跳过保护。',
      okText: '确认批量删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setBatchDeleting(true);
        try {
          const response = await batchDeleteFiles(selectedRowKeys);
          if (!response.success) throw new Error(response.msg);
          const { deletedCount, deletedIds, failed } = response.data;
          const deletedSet = new Set(deletedIds);
          setSelectedRowKeys((keys) => keys.filter((id) => !deletedSet.has(id)));
          if (failed.length > 0) {
            Modal.warning({
              title: deletedCount > 0 ? `已删除 ${deletedCount} 个文件，${failed.length} 个跳过` : '部分或全部文件无法删除',
              content: (
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {failed.map((item) => (
                    <li key={item.id}>{item.name ?? item.id}：{item.reason}</li>
                  ))}
                </ul>
              ),
            });
          } else {
            message.success(`已永久删除 ${deletedCount} 个文件`);
          }
          if (deletedCount > 0) {
            const remainingOnPage = result.list.filter((row) => !deletedSet.has(row.id)).length;
            if (remainingOnPage === 0 && query.page > 1) setPage(query.page - 1, query.pageSize);
            else reload();
          }
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '批量删除失败');
          throw cause;
        } finally {
          setBatchDeleting(false);
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
    { title: '大小', dataIndex: 'size', key: 'size', width: 110, render: formatFileSize,
      sorter: true, sortDirections: ['descend', 'ascend', 'descend'],
      sortOrder: query.sortBy === 'size' ? (query.sortOrder === 'asc' ? 'ascend' : 'descend') : null },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 190,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
      sortDirections: ['descend', 'ascend', 'descend'],
      sorter: true, sortOrder: query.sortBy === 'createdAt' ? (query.sortOrder === 'asc' ? 'ascend' : 'descend') : null },
    { title: '状态', dataIndex: 'archivedAt', key: 'archivedAt', width: 95,
      render: (value: string | null) => value ? <Tag color="default">已归档</Tag> : <Tag color="success">可用</Tag> },
    { title: '操作', key: 'actions', width: 275, render: (_, file) => <Space size={0}>
      <Button type="link" size="small" icon={<Copy size={14} />} onClick={() => void copyUrl(file)}>复制链接</Button>
      {file.archivedAt
        ? <Button type="link" size="small" icon={<RotateCcw size={14} />} onClick={() => confirmRestore(file)}>恢复</Button>
        : <Button type="link" size="small" icon={<Archive size={14} />} onClick={() => confirmArchive(file)}>归档</Button>}
      <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => confirmDelete(file)}>删除</Button>
    </Space> },
  ], [reload, setPage, query.page, query.pageSize, query.status, query.sortBy, query.sortOrder, result.list.length]);

  const onTableChange: TableProps<FileItem>['onChange'] = (_pagination, _filters, sorter, extra) => {
    if (extra.action !== 'sort') return;
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortBy = active?.field === 'size' ? 'size' : 'createdAt';
    const sortOrder = active?.order === 'ascend' ? 'asc' : 'desc';
    setFilters({ ...query, sortBy, sortOrder });
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><FolderOpen size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>素材资源</Text></Space>
          <Title level={2} style={{ margin: 0 }}>文件管理</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>集中管理上传文件，复用已有文件链接。</Paragraph>
        </div>
        <Space wrap>
          <Link to="/upload-settings"><Button>上传设置</Button></Link>
          <Button
            danger
            icon={<Trash2 size={16} />}
            disabled={selectedRowKeys.length === 0 || uploading}
            loading={batchDeleting}
            onClick={confirmBatchDelete}
          >
            批量删除{selectedRowKeys.length > 0 ? `（${selectedRowKeys.length}）` : ''}
          </Button>
          <Upload
            showUploadList={false}
            multiple
            beforeUpload={(file, fileList) => {
              if (file === fileList[0]) void handleBatchUpload(fileList);
              return false;
            }}
          >
            <Button type="primary" icon={<UploadCloud size={16} />} loading={uploading}>
              {uploadProgress ? `上传中 (${uploadProgress.done}/${uploadProgress.total})` : '上传文件'}
            </Button>
          </Upload>
        </Space>
      </Flex>
      <CrudFilterBar
        fields={filterFields}
        values={query}
        defaultValues={defaultFileFilters}
        onSearch={(next) => { setSelectedRowKeys([]); setFilters(next); }}
        onReset={() => { setSelectedRowKeys([]); resetFilters(); }}
      />
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Table<FileItem>
          rowKey="id"
          columns={columns}
          dataSource={result.list}
          loading={loading}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys.map(String)),
          }}
          onChange={onTableChange}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total: result.total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 个文件`,
            onChange: (page, pageSize) => { setSelectedRowKeys([]); setPage(page, pageSize); },
          }}
        />
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
