import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Radio, Space, Tag, Typography, message } from 'antd';
import { Copy, Plus } from 'lucide-react';
import type { DictType } from '../../api/dictionaries';
import { DictionaryTypePickerModal } from './DictionaryTypePickerModal';
import { generateDictionaryFiles } from './generateDictionaryCode';
import type { ExportLanguage, ExportMode, GeneratedFile } from './generateDictionaryCode';

interface Props {
  open: boolean;
  types: DictType[];
  initialTypeId: string | null;
  onClose: () => void;
}

const { Text } = Typography;
const fileNamePattern = /^[A-Za-z][A-Za-z0-9_-]*$/;

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function DictionaryExportModal({ open, types, initialTypeId, onClose }: Props) {
  const [fileName, setFileName] = useState('dictionaries');
  const [language, setLanguage] = useState<ExportLanguage>('ts');
  const [mode, setMode] = useState<ExportMode>('single');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const selectedTypes = selectedIds.map((id) => types.find((type) => type.uuid === id))
    .filter((type): type is DictType => Boolean(type));

  useEffect(() => {
    if (!open) return;
    setFileName('dictionaries');
    setLanguage('ts');
    setMode('single');
    setSelectedIds(initialTypeId === null ? [] : [initialTypeId]);
    setPickerOpen(false);
  }, [initialTypeId, open]);

  const createFiles = (outputMode: ExportMode = mode): GeneratedFile[] => {
    const baseName = fileName.trim();
    if (!fileNamePattern.test(baseName)) {
      throw new Error('文件名称须以字母开头，仅使用字母、数字、下划线或连字符');
    }
    return generateDictionaryFiles(selectedTypes, language, outputMode, baseName);
  };

  const copyCode = async (): Promise<void> => {
    setCopying(true);
    try {
      const [file] = createFiles('single');
      await navigator.clipboard.writeText(file.content);
      message.success('代码已复制');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '复制失败');
    } finally {
      setCopying(false);
    }
  };

  const exportCode = async (): Promise<void> => {
    setExporting(true);
    try {
      const files = createFiles();
      if (mode === 'single') {
        saveBlob(new Blob([files[0].content], { type: 'text/plain;charset=utf-8' }), files[0].name);
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        files.forEach((file) => zip.file(file.name, file.content));
        saveBlob(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), `${fileName.trim()}.zip`);
      }
      message.success(`已导出 ${files.length} 个代码文件`);
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  return <>
    <Modal title="导出字典类型代码" open={open} onCancel={onClose} destroyOnHidden width={680}
      footer={<Space>
        <Button onClick={onClose}>取消</Button>
        <Button icon={<Copy size={16} />} loading={copying} disabled={exporting}
          onClick={() => void copyCode()}>复制代码</Button>
        <Button type="primary" loading={exporting} disabled={copying}
          onClick={() => void exportCode()}>生成并下载</Button>
      </Space>}>
      <Form layout="vertical" style={{ marginTop: 24 }}>
        <Form.Item label="文件名称" required extra="单文件为代码文件名称，多文件为压缩包名称；无需填写扩展名。">
          <Input value={fileName} maxLength={80} onChange={(event) => setFileName(event.target.value)}
            placeholder="例如：dictionaries" />
        </Form.Item>
        <Form.Item label="文件类型">
          <Radio.Group value={language} onChange={(event) => setLanguage(event.target.value as ExportLanguage)}
            options={[{ label: 'TypeScript（.ts）', value: 'ts' }, { label: 'Java（.java）', value: 'java' }]} />
        </Form.Item>
        <Form.Item label={`类型列表（${selectedTypes.length}）`} required>
          <Space size={[6, 8]} wrap>
            {selectedTypes.map((type) => <Tag key={type.uuid} closable
              onClose={() => setSelectedIds((ids) => ids.filter((id) => id !== type.uuid))}>
              {type.name}（{type.code}）
            </Tag>)}
            <Button size="small" type="dashed" icon={<Plus size={14} />} onClick={() => setPickerOpen(true)}>添加</Button>
          </Space>
          {selectedTypes.length === 0 && <div><Text type="secondary">请选择至少一个字典类型</Text></div>}
        </Form.Item>
        <Form.Item label="生成方式" style={{ marginBottom: 0 }}>
          <Radio.Group value={mode} onChange={(event) => setMode(event.target.value as ExportMode)}
            options={[{ label: '单文件：全部类型合并', value: 'single' },
              { label: '多文件：每个类型一个文件（ZIP）', value: 'multiple' }]} />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12 }}>复制代码始终合并为单文件，与下载方式无关。</Text>
      </Form>
    </Modal>
    <DictionaryTypePickerModal open={pickerOpen} types={types} selectedIds={selectedIds}
      onCancel={() => setPickerOpen(false)} onConfirm={(ids) => { setSelectedIds(ids); setPickerOpen(false); }} />
  </>;
}
