import { API_GROUPS } from '../api-docs/apiCatalog';

export interface RequestLogEndpoint {
  path: string;
  title: string;
  module: string;
  audience: 'admin' | 'public';
  methods: string[];
}

// 这些路径由请求日志中间件直接排除，即使加入白名单也不会写入 SQLite。
const excludedPaths = new Set([
  '/api/v1/admin/request-logs',
  '/api/v1/admin/operation-logs',
  '/api/v1/admin/home',
  '/api/v1/admin/system-status',
  '/api/v1/admin/backups/database',
]);

// 白名单仅按请求路径匹配；带路径参数的模板不能作为精准规则直接使用。
const endpoints = new Map<string, RequestLogEndpoint>();
for (const group of API_GROUPS) {
  for (const endpoint of group.endpoints) {
    if (!endpoint.path.startsWith('/api/v1/') || endpoint.path.includes(':') || excludedPaths.has(endpoint.path)) continue;
    const existing = endpoints.get(endpoint.path);
    if (existing) {
      if (!existing.methods.includes(endpoint.method)) existing.methods.push(endpoint.method);
    } else {
      endpoints.set(endpoint.path, {
        path: endpoint.path,
        title: endpoint.title,
        module: group.module,
        audience: group.audience,
        methods: [endpoint.method],
      });
    }
  }
}

export const REQUEST_LOG_ENDPOINTS = [...endpoints.values()];
