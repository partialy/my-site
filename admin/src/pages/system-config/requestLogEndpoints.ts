import { getApiDocsCatalog } from '../../api/apiDocs';

export interface RequestLogEndpoint {
  path: string;
  title: string;
  module: string;
  audience: 'admin' | 'client';
  methods: string[];
}

// 这些路径由请求日志中间件直接排除，即使加入白名单也不会写入 SQLite。
const excludedPaths = new Set([
  '/api/v1/admin/request-logs',
  '/api/v1/admin/operation-logs',
  '/api/v1/admin/home',
  '/api/v1/admin/system-status',
  '/api/v1/admin/backups/database',
  '/api/v1/admin/api-docs',
  '/api/v1/admin/api-docs/detail',
  '/api/v1/admin/api-docs/export',
]);

let cachedEndpoints: RequestLogEndpoint[] | null = null;

/** 从服务端接口文档目录加载可选白名单路径，排除动态路径及不写入日志的接口。 */
export async function loadRequestLogEndpoints(signal?: AbortSignal): Promise<RequestLogEndpoint[]> {
  if (cachedEndpoints) return cachedEndpoints;
  const response = await getApiDocsCatalog(undefined, signal);
  if (!response.success) throw new Error(response.msg);

  const endpoints = new Map<string, RequestLogEndpoint>();
  for (const group of response.data.groups) {
    for (const endpoint of group.endpoints) {
      if (!endpoint.path.startsWith('/api/v1/') || endpoint.path.includes(':') || excludedPaths.has(endpoint.path)) {
        continue;
      }
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
  cachedEndpoints = [...endpoints.values()];
  return cachedEndpoints;
}
