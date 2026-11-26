/** 独立的浏览器上传入口，可复制到业务前端，不依赖具体框架或 Token 存储。 */
export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface UploadOptions {
  /** 公共 API 根路径，默认同源 /api/v1。 */
  apiBaseUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFile(value: unknown, apiBaseUrl: string): UploadedFile {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
    typeof value.mimeType !== 'string' || typeof value.size !== 'number' ||
    typeof value.url !== 'string' || typeof value.createdAt !== 'string' ||
    (value.archivedAt !== null && typeof value.archivedAt !== 'string')) {
    throw new Error('文件数据格式异常');
  }
  const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  return {
    id: value.id, name: value.name, mimeType: value.mimeType, size: value.size,
    url: new URL(value.url, apiOrigin).toString(), createdAt: value.createdAt, archivedAt: value.archivedAt
  };
}

async function requestApi(path: string, base: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try { response = await fetch(`${base}/${path}`, init); }
  catch { throw new Error('连接上传服务失败'); }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new Error(`上传服务响应无效（HTTP ${response.status}）`); }
  if (!isRecord(body) || typeof body.code !== 'number' || typeof body.msg !== 'string' ||
    typeof body.success !== 'boolean' || body.success !== (body.code === 0)) {
    throw new Error('上传服务响应格式异常');
  }
  if (!response.ok || !body.success) throw new Error(body.msg || '上传失败');
  return body.data;
}

function parsePreparation(value: unknown): { strategy: 'local' } |
  { strategy: 'qiniu'; id: string; key: string; token: string; uploadUrl: string } {
  if (!isRecord(value)) throw new Error('上传准备信息格式异常');
  if (value.strategy === 'local') return { strategy: 'local' };
  if (value.strategy !== 'qiniu' || typeof value.id !== 'string' || typeof value.key !== 'string' ||
    typeof value.token !== 'string' || typeof value.uploadUrl !== 'string') throw new Error('上传准备信息格式异常');
  return { strategy: 'qiniu', id: value.id, key: value.key, token: value.token, uploadUrl: value.uploadUrl };
}

/** 返回文件信息，其中 url 是可直接保存到业务表的完整访问地址。 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadedFile> {
  const apiBaseUrl = options.apiBaseUrl ?? '/api/v1';
  const base = apiBaseUrl.replace(/\/+$/, '');
  const mimeType = file.name.toLowerCase().endsWith('.ico') ? 'image/x-icon'
    : file.type || 'application/octet-stream';
  const prepared = parsePreparation(await requestApi('uploads/prepare', base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType, size: file.size }),
  }));
  if (prepared.strategy === 'local') {
    const value = await requestApi('uploads/local', base, {
      method: 'POST', body: file,
      headers: { 'Content-Type': mimeType, 'X-File-Name': encodeURIComponent(file.name) },
    });
    return parseFile(value, apiBaseUrl);
  }

  const form = new FormData();
  form.set('token', prepared.token);
  form.set('key', prepared.key);
  form.set('file', mimeType === file.type ? file : new Blob([file], { type: mimeType }), file.name);
  let response: Response;
  try { response = await fetch(prepared.uploadUrl, { method: 'POST', body: form }); }
  catch { throw new Error('连接七牛云上传域名失败'); }
  if (!response.ok) {
    let detail = '';
    try {
      const errBody: unknown = await response.json();
      if (isRecord(errBody) && typeof errBody.error === 'string') detail = errBody.error;
    } catch { /* 忽略非 JSON 错误响应 */ }
    throw new Error(`七牛云上传失败（HTTP ${response.status}${detail ? `：${detail}` : ''}）`);
  }
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new Error('七牛云上传响应无效'); }
  if (!isRecord(result) || result.key !== prepared.key) throw new Error('七牛云返回的文件标识不一致');

  const completed = await requestApi('uploads/complete', base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: prepared.id, key: prepared.key, name: file.name, mimeType, size: file.size }),
  });
  return parseFile(completed, apiBaseUrl);
}
