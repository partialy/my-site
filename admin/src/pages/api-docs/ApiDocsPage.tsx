import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Collapse, Empty, Input, Segmented, Spin, Tag, Typography, message } from 'antd';
import { BookOpen, Braces, Download, FileText, LockKeyhole, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  exportApiDocs, getApiDocDetail, getApiDocsCatalog,
  type ApiDocAudience, type ApiDocCatalog, type ApiDocDetail, type ApiDocMethod,
} from '../../api/apiDocs';
import { JsonCodeBlock } from './JsonCodeBlock';
import './apiDocs.css';

const { Text } = Typography;
type AudienceFilter = 'all' | ApiDocAudience;

const methodColors: Record<ApiDocMethod, string> = {
  GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red', PATCH: 'purple',
};

function resolveRelativeDocPath(currentDocPath: string | null, href: string): string | null {
  const cleanHref = href.split('#')[0]?.split('?')[0]?.trim() ?? '';
  if (!cleanHref.endsWith('.md')) return null;
  if (!currentDocPath || cleanHref.startsWith('admin/') || cleanHref.startsWith('client/')) {
    return cleanHref.replace(/^\.\//, '');
  }
  const baseParts = currentDocPath.split('/').slice(0, -1);
  for (const segment of cleanHref.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') baseParts.pop();
    else baseParts.push(segment);
  }
  return baseParts.join('/');
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function MarkdownViewer({
  markdown,
  currentDocPath,
  onNavigateDoc,
}: {
  markdown: string;
  currentDocPath: string | null;
  onNavigateDoc: (docPath: string) => void;
}) {
  return (
    <div className="api-doc-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }: { children?: ReactNode }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || '');
            const text = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || text.includes('\n');
            if (!isBlock) {
              return <code className="api-doc-inline-code" {...props}>{children}</code>;
            }
            const lang = match?.[1]?.toLowerCase() ?? 'text';
            return <JsonCodeBlock label={lang.toUpperCase()} value={text} json={lang === 'json'} />;
          },
          a({ href, children, ...props }) {
            if (href) {
              const resolved = resolveRelativeDocPath(currentDocPath, href);
              if (resolved) {
                return (
                  <a
                    href={`?doc=${encodeURIComponent(resolved)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigateDoc(resolved);
                    }}
                  >
                    {children}
                  </a>
                );
              }
            }
            return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export function ApiDocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDoc = searchParams.get('doc');

  const [audience, setAudience] = useState<AudienceFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catalog, setCatalog] = useState<ApiDocCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [detail, setDetail] = useState<ApiDocDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError(null);
    void getApiDocsCatalog(debouncedSearch, controller.signal).then((response) => {
      if (!response.success) throw new Error(response.msg);
      if (!controller.signal.aborted) setCatalog(response.data);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setCatalogError(cause instanceof Error ? cause.message : '加载接口目录失败');
    }).finally(() => {
      if (!controller.signal.aborted) setCatalogLoading(false);
    });
    return () => controller.abort();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!selectedDoc) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    void getApiDocDetail(selectedDoc, controller.signal).then((response) => {
      if (!response.success) throw new Error(response.msg);
      if (!controller.signal.aborted) setDetail(response.data);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setDetailError(cause instanceof Error ? cause.message : '加载接口详情失败');
    }).finally(() => {
      if (!controller.signal.aborted) setDetailLoading(false);
    });
    return () => controller.abort();
  }, [selectedDoc]);

  const visibleGroups = useMemo(() => {
    if (!catalog) return [];
    return audience === 'all' ? catalog.groups : catalog.groups.filter((group) => group.audience === audience);
  }, [catalog, audience]);

  const visibleCount = useMemo(
    () => visibleGroups.reduce((sum, group) => sum + group.endpoints.length, 0),
    [visibleGroups],
  );

  const selectDoc = (docPath: string | null) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (docPath) next.set('doc', docPath);
      else next.delete('doc');
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportApiDocs();
      if (!response.success) throw new Error(response.msg);
      downloadTextFile(response.data.filename, response.data.content);
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '导出文档失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="api-doc-page">
      <header className="api-doc-header">
        <div className="api-doc-eyebrow"><BookOpen size={16} /> API REFERENCE / 服务端接口文档</div>
        <div className="api-doc-title-row">
          <div>
            <h1>接口文档</h1>
            <p>实时解析 <code>server/api-docs/</code> 目录与 Markdown 文档，保持服务端文档与在线预览一致。</p>
          </div>
          <Button icon={<Download size={16} />} loading={exporting} onClick={() => void handleExport()}>
            导出完整文档
          </Button>
        </div>
      </header>

      <div className="api-doc-toolbar">
        <Segmented
          value={audience}
          onChange={(value) => setAudience(value as AudienceFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '管理端', value: 'admin' },
            { label: '客户端 / 公开', value: 'client' },
          ]}
        />
        <Input
          prefix={<Search size={16} />}
          placeholder="搜索名称、路径、模块或文档内容"
          allowClear
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="api-doc-search"
        />
        <span className="api-doc-count">
          <Braces size={14} /> 共 {visibleCount} 个接口
        </span>
      </div>

      {catalogError && <Alert type="error" showIcon message={catalogError} style={{ marginBottom: 16 }} />}

      <div className="api-doc-layout">
        <aside className="api-doc-sidebar">
          <button
            type="button"
            className={`api-doc-overview-btn${!selectedDoc ? ' is-active' : ''}`}
            onClick={() => selectDoc(null)}
          >
            <FileText size={15} />
            <span>通用约定与概览</span>
          </button>

          <Spin spinning={catalogLoading}>
            {visibleGroups.length === 0 && !catalogLoading ? (
              <div className="api-doc-sidebar-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的接口" />
              </div>
            ) : (
              <Collapse
                ghost
                defaultActiveKey={visibleGroups.map((group) => `${group.audience}:${group.module}`)}
                className="api-doc-nav-collapse"
                items={visibleGroups.map((group) => ({
                  key: `${group.audience}:${group.module}`,
                  label: (
                    <div className="api-doc-nav-group-label">
                      <span>{group.module}</span>
                      <Tag className="api-doc-audience-tag">
                        {group.audience === 'admin' ? '管理端' : '客户端'} · {group.endpoints.length}
                      </Tag>
                    </div>
                  ),
                  children: (
                    <div className="api-doc-nav-items">
                      {group.endpoints.map((endpoint) => (
                        <button
                          key={endpoint.docPath}
                          type="button"
                          className={`api-doc-nav-item${selectedDoc === endpoint.docPath ? ' is-active' : ''}`}
                          onClick={() => selectDoc(endpoint.docPath)}
                        >
                          <div className="api-doc-nav-item-top">
                            <Tag color={methodColors[endpoint.method]} className="api-doc-method">{endpoint.method}</Tag>
                            <span className="api-doc-nav-item-title">{endpoint.title}</span>
                          </div>
                          <code className="api-doc-nav-item-path">{endpoint.path}</code>
                        </button>
                      ))}
                    </div>
                  ),
                }))}
              />
            )}
          </Spin>
        </aside>

        <section className="api-doc-content-panel">
          {!selectedDoc ? (
            <Spin spinning={catalogLoading}>
              {catalog ? (
                <MarkdownViewer
                  markdown={catalog.overviewMarkdown}
                  currentDocPath={null}
                  onNavigateDoc={selectDoc}
                />
              ) : (
                <Empty description="暂无文档数据" />
              )}
            </Spin>
          ) : detailError ? (
            <Alert type="error" showIcon message={detailError} />
          ) : (
            <Spin spinning={detailLoading}>
              {detail && (
                <>
                  <div className="api-doc-detail-banner">
                    <div className="api-doc-detail-badges">
                      <Tag color={methodColors[detail.method]} className="api-doc-method">{detail.method}</Tag>
                      <Text code copyable={{ text: detail.path }} className="api-doc-detail-path">{detail.path}</Text>
                      {detail.auth ? (
                        <Tag icon={<LockKeyhole size={12} />} className="api-doc-auth">{detail.authText}</Tag>
                      ) : (
                        <Tag>{detail.authText}</Tag>
                      )}
                    </div>
                    <Text type="secondary" className="api-doc-file-ref">
                      {detail.audience === 'admin' ? '管理端' : '客户端 / 公开'} · {detail.module} · <code>{detail.docPath}</code>
                    </Text>
                  </div>
                  <MarkdownViewer
                    markdown={detail.content}
                    currentDocPath={detail.docPath}
                    onNavigateDoc={selectDoc}
                  />
                </>
              )}
            </Spin>
          )}
        </section>
      </div>
    </main>
  );
}
