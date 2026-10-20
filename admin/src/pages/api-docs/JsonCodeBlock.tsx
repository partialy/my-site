import { Button, message } from 'antd';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const jsonToken = /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g;

function highlightJson(code: string) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of code.matchAll(jsonToken)) {
    const token = match[0];
    const index = match.index;
    if (index > cursor) nodes.push(code.slice(cursor, index));
    const tone = token.startsWith('"')
      ? /^\s*:/.test(code.slice(index + token.length)) ? 'key' : 'string'
      : token === 'true' || token === 'false' || token === 'null' ? 'literal' : 'number';
    nodes.push(<span className={`api-doc-json-${tone}`} key={index}>{token}</span>);
    cursor = index + token.length;
  }
  if (cursor < code.length) nodes.push(code.slice(cursor));
  return nodes;
}

export function JsonCodeBlock({ label, value, json = true }: { label: string; value: unknown; json?: boolean }) {
  const [copied, setCopied] = useState(false);
  const code = json ? JSON.stringify(value, null, 2) : String(value);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      message.success('已复制');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      message.error('复制失败，请手动选择文本');
    }
  };

  return <div className="api-doc-code-block">
    <div className="api-doc-detail-label"><span>{label}</span>
      <Button type="text" size="small" icon={copied ? <Check size={13} /> : <Copy size={13} />}
        onClick={() => void copy()} aria-label={`复制${label}`}>{copied ? '已复制' : '复制'}</Button>
    </div>
    <pre><code>{json ? highlightJson(code) : code}</code></pre>
  </div>;
}
