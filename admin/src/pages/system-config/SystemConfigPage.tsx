import { useState } from 'react';
import { Alert, Button, Card, Flex, Input, message, Select, Skeleton, Space, Switch, Tag, Typography } from 'antd';
import { Database, FileText, ListFilter, RefreshCw, Save, Settings2, Terminal } from 'lucide-react';
import type { RequestLogMode } from '../../api/systemConfig';
import { useSystemConfig } from './useSystemConfig';
import { WhitelistModal } from './WhitelistModal';
import { SiteIdentitySection } from './SiteIdentitySection';

const { Title, Text, Paragraph } = Typography;

const modeOptions: { value: RequestLogMode; label: string }[] = [
  { value: 'off', label: '关闭' },
  { value: 'all', label: '全部记录' },
  { value: 'white_list', label: '白名单' },
];

const formatVariables = [
  { key: 'time', name: '时间' },
  { key: 'method', name: '请求方法' },
  { key: 'url', name: '请求地址' },
  { key: 'status', name: '状态码' },
  { key: 'duration', name: '耗时' },
  { key: 'ip', name: '来源 IP' },
];

function previewFormat(format: string): string {
  const samples: Record<string, string> = {
    time: '2026-09-10 10:02:32', method: 'GET',
    url: '/api/v1/user/info?id=1', status: '200', duration: '15ms', ip: '127.0.0.1',
  };
  return format.replace(/\$\{(\w+)\}/g, (all, key: string) => samples[key] ?? all);
}

export function SystemConfigPage() {
  const { config, draft, loading, saving, error, reload, save, updateDraft, refreshWhitelist } = useSystemConfig();
  const [whitelistOpen, setWhitelistOpen] = useState(false);
  const dirty = Boolean(config && draft && (
    config.requestLogMode !== draft.requestLogMode ||
    config.consoleLogEnabled !== draft.consoleLogEnabled ||
    config.consoleLogFormat !== draft.consoleLogFormat
  ));

  const copyVariable = async (key: string) => {
    try {
      await navigator.clipboard.writeText(`\${${key}}`);
      message.success('已复制');
    } catch {
      message.error('复制失败，请检查浏览器剪贴板权限');
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Space size={10} style={{ color: '#2563eb', marginBottom: 8 }}><Settings2 size={17} /><Text style={{ color: '#2563eb', fontWeight: 600 }}>框架设置</Text></Space>
          <Title level={2} style={{ margin: 0 }}>系统管理</Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>管理请求日志、控制台输出和网站信息。配置保存后立即生效。</Paragraph>
        </div>
        <Space>
          <Button icon={<RefreshCw size={16} />} onClick={() => void reload()} loading={loading}>刷新</Button>
          <Button type="primary" icon={<Save size={16} />} loading={saving} disabled={!dirty} onClick={() => void save()}>保存配置</Button>
        </Space>
      </Flex>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}
      {loading || !draft ? <Card><Skeleton active paragraph={{ rows: 8 }} /></Card> : (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Card styles={{ body: { padding: 28 } }} style={{ borderRadius: 16 }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={20}>
              <Flex align="center" gap={16}>
                <div className="system-config-icon"><Database size={20} /></div>
                <div>
                  <Title level={4} style={{ margin: '0 0 5px' }}>请求日志记录</Title>
                  <Text type="secondary">将接口路径、参数、结果与来源信息写入框架 SQLite。</Text>
                </div>
              </Flex>
              <div style={{ width: 330, maxWidth: '100%' }}>
                <Select<RequestLogMode>
                  value={draft.requestLogMode}
                  onChange={(value) => updateDraft({ requestLogMode: value })}
                  options={modeOptions}
                  style={{ width: '100%' }}
                />
                <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 12 }}>全部记录含登录与初始化；白名单仅记录匹配请求。</Text></div>
              </div>
            </Flex>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="system-config-subsection">
              <Space size={12}>
                <div className="system-config-small-icon"><ListFilter size={17} /></div>
                <div><Text strong>路径白名单</Text><div><Text type="secondary" style={{ fontSize: 12 }}>已配置 {config?.requestLogWhitelist.length ?? 0} 条规则</Text></div></div>
              </Space>
              <Button onClick={() => setWhitelistOpen(true)}>管理白名单</Button>
            </Flex>
          </Card>

          <Card styles={{ body: { padding: 28 } }} style={{ borderRadius: 16 }}>
            <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
              <Flex align="start" gap={16}>
                <div className="system-config-icon terminal"><Terminal size={20} /></div>
                <div><Title level={4} style={{ margin: '0 0 5px' }}>控制台日志输出</Title><Text type="secondary">新日志中间件按模板打印请求摘要，默认开启。</Text></div>
              </Flex>
              <Switch checked={draft.consoleLogEnabled} onChange={(checked) => updateDraft({ consoleLogEnabled: checked })} checkedChildren="开启" unCheckedChildren="关闭" />
            </Flex>
            <div className="system-config-subsection">
              <Flex align="center" gap={8} style={{ marginBottom: 10 }}><FileText size={16} color="#64748b" /><Text strong>输出格式</Text></Flex>
              <Input
                value={draft.consoleLogFormat}
                onChange={(event) => updateDraft({ consoleLogFormat: event.target.value })}
                maxLength={500}
                placeholder={'[${time}][${method}] ${url}'}
                disabled={!draft.consoleLogEnabled}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}
              />
              <Flex gap={6} wrap="wrap" style={{ marginTop: 13 }}>
                {formatVariables.map(({ key, name }) => <Tag key={key} color="blue" style={{ margin: 0, cursor: 'pointer' }} title="点击复制变量" onClick={() => void copyVariable(key)}>{name} {`\${${key}}`}</Tag>)}
              </Flex>
              <div className="system-config-preview"><Text type="secondary" style={{ fontSize: 12 }}>输出预览</Text><div>{previewFormat(draft.consoleLogFormat) || '—'}</div></div>
            </div>
          </Card>
        </Space>
      )}
      <div style={{ marginTop: 18 }}><SiteIdentitySection /></div>
      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} onChanged={() => void refreshWhitelist()} />
    </div>
  );
}
