import { API_ENDPOINT_COUNT, API_GROUPS } from './apiCatalog';
import { getEndpointExample } from './apiExamples';

export const API_RESPONSE_CODES = [
  '0 成功', '-1 服务端失败', '1001 参数校验失败', '1002 初始化密钥错误', '1003 已初始化',
  '1004 登录凭证错误', '1005 未登录', '1006 Token 无效', '1007 Token 过期',
  '1008 原密码错误', '1009 资源不存在', '1010 配置键已存在',
] as const;

export function generateApiDocsMarkdown(): string {
  const lines = [
    '# 接口文档', '',
    `共 ${API_ENDPOINT_COUNT} 个接口。基础路径：\`/api/v1\`；管理接口使用 \`/api/v1/admin\`。`, '',
    '除二进制文件接口外，响应统一为 `{ code, msg, data, success }`。成功时 `code=0`，失败时 `success=false`。',
    '标注 JWT 的接口需发送 `Authorization: Bearer <token>`。以下 JSON 仅为结构示例，示例值不代表实时数据。', '',
  ];

  for (const audience of ['admin', 'public'] as const) {
    lines.push(`## ${audience === 'admin' ? '管理端' : '用户端 / 公共接口'}`, '');
    for (const group of API_GROUPS.filter((item) => item.audience === audience)) {
      lines.push(`### ${group.module}`, '');
      for (const endpoint of group.endpoints) {
        const example = getEndpointExample(endpoint);
        lines.push(`#### ${endpoint.method} ${endpoint.path} · ${endpoint.title}`, '',
          `- 鉴权：${endpoint.auth ? 'JWT' : '无需登录'}`);
        if (endpoint.request) lines.push(`- 请求参数：${endpoint.request}`);
        if (endpoint.note) lines.push(`- 说明：${endpoint.note}`);
        lines.push('', `**请求示例${example.requestKind ? `（${example.requestKind}）` : ''}**`, '');
        if (example.request === undefined) {
          lines.push('无额外参数', '');
        } else {
          lines.push('```json', JSON.stringify(example.request, null, 2), '```', '');
        }
        if (endpoint.binary) {
          lines.push('**响应内容（二进制）**', '', endpoint.response, '');
        } else {
          lines.push(`**成功响应（JSON）**`, '', '```json',
            JSON.stringify(example.response, null, 2), '```', '',
            `data 字段：${endpoint.response}`, '');
        }
      }
    }
  }

  lines.push('## 通用返回与业务码', '',
    'JSON 接口统一返回 `{ code: number, msg: string, data: T | null, success: boolean }`。',
    '参数错误的 `data` 为 `{ fieldErrors: Record<string, string[]> }`；文件内容和图标接口返回二进制。', '',
    ...API_RESPONSE_CODES.map((code) => `- ${code}`), '');
  return lines.join('\n');
}

export function downloadApiDocsMarkdown(): void {
  const blob = new Blob([generateApiDocsMarkdown()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'NodeBase-接口文档.md';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
