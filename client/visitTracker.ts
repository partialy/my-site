const visitorIdKey = 'nodebase.visitor-id';
const lastVisitDayKey = 'nodebase.last-visit-day';
let pending: Promise<boolean> | null = null;
let memoryVisitorId: string | null = null;

interface VisitResult {
  code: number;
  success: boolean;
  data?: { recorded?: boolean; day?: string };
}

export interface TrackVisitOptions {
  apiBaseUrl?: string;
  path?: string;
  pageTitle?: string;
  referrer?: string;
}

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function storageSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch { /* 浏览器禁用存储时仍可依靠服务端去重。 */ }
}

function getVisitorId(): string {
  if (memoryVisitorId) return memoryVisitorId;
  const saved = storageGet(visitorIdKey);
  if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
  memoryVisitorId = crypto.randomUUID();
  storageSet(visitorIdKey, memoryVisitorId);
  return memoryVisitorId;
}

/** 在前台应用入口或首个页面调用一次；服务端会再次按访客 ID 和 UTC 日期去重。 */
export function trackVisit(options: TrackVisitOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const day = new Date().toISOString().slice(0, 10);
  if (storageGet(lastVisitDayKey) === day) return Promise.resolve(false);
  if (pending) return pending;

  pending = (async () => {
    try {
      const response = await fetch(`${(options.apiBaseUrl ?? '/api/v1').replace(/\/+$/, '')}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          visitorId: getVisitorId(), path: options.path ?? location.pathname,
          pageTitle: options.pageTitle ?? document.title,
          referrer: options.referrer ?? (document.referrer || undefined),
        }),
      });
      const result = await response.json() as VisitResult;
      if (!response.ok || result.code !== 0 || !result.success || !result.data?.day) return false;
      storageSet(lastVisitDayKey, result.data.day);
      return result.data.recorded === true;
    } catch {
      return false;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
