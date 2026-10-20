import { useMemo, useState } from 'react';
import { Collapse, Empty, Input, Select, Segmented, Tag, Typography } from 'antd';
import { BookOpen, Braces, LockKeyhole, Search } from 'lucide-react';
import { API_ENDPOINT_COUNT, API_GROUPS } from './apiCatalog';
import type { ApiAudience, ApiEndpoint, ApiGroup, ApiMethod } from './apiCatalog';
import './apiDocs.css';

const { Text } = Typography;
type AudienceFilter = 'all' | ApiAudience;

const methodColors: Record<ApiMethod, string> = {
  GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red',
};

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  return <div className="api-doc-detail">
    <p className="api-doc-summary">{endpoint.title}</p>
    <div className="api-doc-detail-grid">
      <div>
        <div className="api-doc-detail-label">请求</div>
        <pre>{endpoint.request ?? '无额外参数'}</pre>
      </div>
      <div>
        <div className="api-doc-detail-label">{endpoint.binary ? '响应内容' : '成功时 data 字段'}</div>
        <pre>{endpoint.response}</pre>
      </div>
    </div>
    {endpoint.note && <p className="api-doc-note">{endpoint.note}</p>}
  </div>;
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  return <Collapse ghost className="api-doc-endpoint" items={[{
    key: endpoint.path + endpoint.method,
    label: <div className="api-doc-endpoint-title">
      <Tag color={methodColors[endpoint.method]} className="api-doc-method">{endpoint.method}</Tag>
      <code className="api-doc-path">{endpoint.path}</code>
      <span className="api-doc-endpoint-name">{endpoint.title}</span>
      {endpoint.auth && <Tag className="api-doc-auth" icon={<LockKeyhole size={12} />}>JWT</Tag>}
    </div>,
    children: <EndpointDetail endpoint={endpoint} />,
  }]} />;
}

function GroupSection({ group }: { group: ApiGroup }) {
  return <section className="api-doc-group">
    <div className="api-doc-group-heading">
      <div className="api-doc-group-name"><span className="api-doc-group-dot" />
        <h2>{group.module}</h2><Text type="secondary">{group.endpoints.length} 个接口</Text>
      </div>
    </div>
    <div className="api-doc-group-list">
      {group.endpoints.map((endpoint) => <EndpointRow key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />)}
    </div>
  </section>;
}

export function ApiDocsPage() {
  const [audience, setAudience] = useState<AudienceFilter>('all');
  const [module, setModule] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const moduleOptions = useMemo(() => API_GROUPS
    .filter((group) => audience === 'all' || group.audience === audience)
    .map((group) => ({ label: `${group.audience === 'admin' ? '管理端' : '用户端 / 公共'} · ${group.module}`,
      value: `${group.audience}:${group.module}` })), [audience]);
  const groups = useMemo(() => API_GROUPS.flatMap((group) => {
    if (audience !== 'all' && group.audience !== audience) return [];
    if (module && module !== `${group.audience}:${group.module}`) return [];
    const term = search.trim().toLowerCase();
    const endpoints = term ? group.endpoints.filter((endpoint) =>
      [endpoint.title, endpoint.path, endpoint.method, group.module].some((value) => value.toLowerCase().includes(term)))
      : group.endpoints;
    return endpoints.length ? [{ ...group, endpoints }] : [];
  }), [audience, module, search]);
  const count = groups.reduce((total, group) => total + group.endpoints.length, 0);

  return <main className="api-doc-page">
    <header className="api-doc-header">
      <div className="api-doc-eyebrow"><BookOpen size={16} /> API REFERENCE / 接口目录</div>
      <h1>接口文档</h1>
      <p>当前服务端接口的请求方式、参数与响应字段。新增或修改接口时同步维护此页面。</p>
    </header>
    <div className="api-doc-overview">
      <div><Braces size={19} /><strong>{API_ENDPOINT_COUNT}</strong><span>当前接口</span></div>
      <p>基础路径 <code>/api/v1</code>；管理接口使用 <code>/api/v1/admin</code>。
        除二进制文件接口外，响应统一为 <code>{'{ code, msg, data, success }'}</code>。
        成功 <code>code=0</code>，失败 <code>success=false</code>；标注 JWT 的接口需发送 <code>Authorization: Bearer &lt;token&gt;</code>。</p>
    </div>
    <div className="api-doc-filters">
      <Segmented value={audience} onChange={(value) => { setAudience(value as AudienceFilter); setModule(undefined); }}
        options={[{ label: '全部', value: 'all' }, { label: '管理端', value: 'admin' },
          { label: '用户端 / 公共', value: 'public' }]} />
      <Select placeholder="全部模块" allowClear value={module} onChange={setModule}
        options={moduleOptions} className="api-doc-module-select" />
      <Input prefix={<Search size={16} />} placeholder="搜索路径、名称或模块" allowClear
        value={search} onChange={(event) => setSearch(event.target.value)} className="api-doc-search" />
      <span className="api-doc-count">显示 {count} 个接口</span>
    </div>
    {(['admin', 'public'] as const).map((kind) => {
      const sectionGroups = groups.filter((group) => group.audience === kind);
      if (!sectionGroups.length) return null;
      return <div className="api-doc-audience" key={kind}>
        <div className="api-doc-audience-heading"><span>{kind === 'admin' ? '管理端' : '用户端 / 公共接口'}</span>
          <small>{kind === 'admin' ? '后台管理与运维能力' : '前台页面和公开资源可使用'}</small></div>
        {sectionGroups.map((group) => <GroupSection key={`${kind}:${group.module}`} group={group} />)}
      </div>;
    })}
    {!groups.length && <div className="api-doc-empty"><Empty description="没有匹配的接口" /></div>}
    <section className="api-doc-conventions">
      <h2>通用返回与业务码</h2>
      <p>JSON 接口统一返回 <code>{'{ code: number, msg: string, data: T | null, success: boolean }'}</code>。
        参数错误的 <code>data</code> 为 <code>{'{ fieldErrors: Record<string, string[]> }'}</code>；文件内容和图标接口返回二进制。</p>
      <div className="api-doc-code-list">
        {['0 成功', '-1 服务端失败', '1001 参数校验失败', '1002 初始化密钥错误', '1003 已初始化',
          '1004 登录凭证错误', '1005 未登录', '1006 Token 无效', '1007 Token 过期',
          '1008 原密码错误', '1009 资源不存在', '1010 配置键已存在'].map((item) =>
          <span key={item}>{item}</span>)}
      </div>
    </section>
  </main>;
}
