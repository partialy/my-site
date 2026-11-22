import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';

export type ApiDocAudience = 'admin' | 'client';
export type ApiDocMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiDocEndpoint {
  title: string;
  method: ApiDocMethod;
  path: string;
  auth: boolean;
  authText: string;
  docPath: string;
}

export interface ApiDocGroup {
  audience: ApiDocAudience;
  module: string;
  endpoints: ApiDocEndpoint[];
}

export interface ApiDocCatalog {
  overviewMarkdown: string;
  groups: ApiDocGroup[];
  total: number;
}

export interface ApiDocDetail extends ApiDocEndpoint {
  audience: ApiDocAudience;
  module: string;
  content: string;
}

export const apiDocsCatalogQuerySchema = z.strictObject({
  search: z.string().trim().max(100).optional(),
});

export const apiDocDetailQuerySchema = z.strictObject({
  docPath: z.string().trim().min(1).max(260),
});

const tableRowPattern = /^\|\s*([^|]+?)\s*\|\s*`?(GET|POST|PUT|DELETE|PATCH)`?\s*\|\s*`?([^`|]+?)`?\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|$/i;

function normalizeRelPath(relPath: string): string {
  return relPath.replaceAll('\\', '/').replace(/^\.\//, '');
}

export class ApiDocsService {
  private readonly docsRoot = path.resolve(__dirname, '../../api-docs');

  private resolveSafeDocFile(docPath: string): string {
    const normalized = normalizeRelPath(docPath);
    if (!normalized.endsWith('.md') || normalized.includes('..') || path.isAbsolute(normalized)) {
      throw new ApiError(400, ApiCode.ValidationError, '无效的文档路径', { fieldErrors: { docPath: ['文档路径无效'] } });
    }
    const target = path.resolve(this.docsRoot, normalized);
    if (!target.startsWith(`${this.docsRoot}${path.sep}`)) {
      throw new ApiError(400, ApiCode.ValidationError, '无效的文档路径', { fieldErrors: { docPath: ['文档路径越界'] } });
    }
    return target;
  }

  private readIndexFile(): string {
    const indexFile = path.join(this.docsRoot, 'index.md');
    if (!existsSync(indexFile)) {
      throw new ApiError(404, ApiCode.NotFound, '接口文档索引不存在');
    }
    return readFileSync(indexFile, 'utf8');
  }

  private parseIndex(): {
    overviewMarkdown: string;
    groups: ApiDocGroup[];
    byDocPath: Map<string, ApiDocEndpoint & { audience: ApiDocAudience; module: string }>;
  } {
    const raw = this.readIndexFile();
    const lines = raw.split(/\r?\n/);

    const overviewLines: string[] = [];
    let inOverview = false;
    let audience: ApiDocAudience | null = null;
    let currentGroup: ApiDocGroup | null = null;
    const groups: ApiDocGroup[] = [];
    const byDocPath = new Map<string, ApiDocEndpoint & { audience: ApiDocAudience; module: string }>();

    for (const line of lines) {
      if (line.startsWith('## 通用约定')) {
        inOverview = true;
        overviewLines.push(line);
        continue;
      }
      if (inOverview) {
        if (line.trim() === '---') {
          inOverview = false;
        } else {
          overviewLines.push(line);
        }
        continue;
      }

      if (line.startsWith('## 管理端接口')) {
        audience = 'admin';
        currentGroup = null;
        continue;
      }
      if (line.startsWith('## 客户端')) {
        audience = 'client';
        currentGroup = null;
        continue;
      }
      if (line.startsWith('### ') && audience) {
        const rawTitle = line.slice(4).trim();
        const moduleName = rawTitle.replace(/（[^）]*）$/, '').trim();
        currentGroup = { audience, module: moduleName, endpoints: [] };
        groups.push(currentGroup);
        continue;
      }

      if (currentGroup && line.startsWith('|')) {
        const match = tableRowPattern.exec(line);
        if (!match) continue;
        const title = match[1]!.trim();
        const method = match[2]!.toUpperCase() as ApiDocMethod;
        const apiPath = match[3]!.trim();
        const authText = match[4]!.trim();
        const docPath = normalizeRelPath(match[5]!.trim());
        const endpoint: ApiDocEndpoint = {
          title,
          method,
          path: apiPath,
          auth: authText !== '否' && authText !== '无需鉴权',
          authText,
          docPath,
        };
        currentGroup.endpoints.push(endpoint);
        byDocPath.set(docPath, { ...endpoint, audience: currentGroup.audience, module: currentGroup.module });
      }
    }

    return {
      overviewMarkdown: overviewLines.join('\n').trim(),
      groups: groups.filter((group) => group.endpoints.length > 0),
      byDocPath,
    };
  }

  getCatalog(search?: string): ApiDocCatalog {
    const parsed = this.parseIndex();
    const term = search?.trim().toLowerCase() ?? '';
    if (!term) {
      const total = parsed.groups.reduce((sum, group) => sum + group.endpoints.length, 0);
      return { overviewMarkdown: parsed.overviewMarkdown, groups: parsed.groups, total };
    }

    const filteredGroups: ApiDocGroup[] = [];
    for (const group of parsed.groups) {
      const moduleMatches = group.module.toLowerCase().includes(term);
      const endpoints = group.endpoints.filter((endpoint) => {
        if (moduleMatches) return true;
        if ([endpoint.title, endpoint.path, endpoint.method, endpoint.authText].some((v) => v.toLowerCase().includes(term))) {
          return true;
        }
        const filePath = this.resolveSafeDocFile(endpoint.docPath);
        if (!existsSync(filePath)) return false;
        return readFileSync(filePath, 'utf8').toLowerCase().includes(term);
      });
      if (endpoints.length > 0) filteredGroups.push({ ...group, endpoints });
    }

    const total = filteredGroups.reduce((sum, group) => sum + group.endpoints.length, 0);
    return { overviewMarkdown: parsed.overviewMarkdown, groups: filteredGroups, total };
  }

  getDetail(docPath: string): ApiDocDetail {
    const normalized = normalizeRelPath(docPath);
    const parsed = this.parseIndex();
    const meta = parsed.byDocPath.get(normalized);
    if (!meta) {
      throw new ApiError(404, ApiCode.NotFound, '接口文档不存在');
    }
    const filePath = this.resolveSafeDocFile(normalized);
    if (!existsSync(filePath)) {
      throw new ApiError(404, ApiCode.NotFound, '接口文档文件不存在');
    }
    return { ...meta, content: readFileSync(filePath, 'utf8') };
  }

  exportMarkdown(): { filename: string; content: string } {
    const parsed = this.parseIndex();
    const parts: string[] = [
      '# NodeBase 服务端接口文档',
      '',
      parsed.overviewMarkdown,
      '',
    ];

    for (const audience of ['admin', 'client'] as const) {
      const sectionGroups = parsed.groups.filter((group) => group.audience === audience);
      if (!sectionGroups.length) continue;
      parts.push(`## ${audience === 'admin' ? '管理端接口' : '客户端 / 公开接口'}`, '');
      for (const group of sectionGroups) {
        parts.push(`### ${group.module}`, '');
        for (const endpoint of group.endpoints) {
          const filePath = this.resolveSafeDocFile(endpoint.docPath);
          if (!existsSync(filePath)) continue;
          const content = readFileSync(filePath, 'utf8').trim();
          // 将单文档内的一级标题降为四级，保持整份导出文档层级清晰。
          const adjusted = content.replace(/^# /m, `#### ${endpoint.method} \`${endpoint.path}\` · `).replace(/^## /gm, '##### ');
          parts.push(adjusted, '', '---', '');
        }
      }
    }

    return { filename: 'NodeBase-接口文档.md', content: parts.join('\n') };
  }
}
