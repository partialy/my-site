import { createHash } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { ApiCode } from '../api/codes';

interface Limit { max: number; windowMs: number }

class SlidingWindow {
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly limit: Limit) {}

  remaining(key: string): number {
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter((time) => time > now - this.limit.windowMs);
    if (recent.length) this.attempts.set(key, recent);
    else this.attempts.delete(key);
    return this.limit.max - recent.length;
  }

  add(key: string): void {
    this.remaining(key);
    this.attempts.set(key, [...(this.attempts.get(key) ?? []), Date.now()]);
    if (this.attempts.size > 10_000) this.sweep();
  }

  retryAfter(key: string): number {
    const oldest = this.attempts.get(key)?.[0] ?? Date.now();
    return Math.max(1, Math.ceil((oldest + this.limit.windowMs - Date.now()) / 1000));
  }

  private sweep(): void {
    for (const key of this.attempts.keys()) this.remaining(key);
  }
}

function clientKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function reject(res: Response, seconds: number): void {
  res.set('Retry-After', String(seconds));
  res.status(429).json({ code: ApiCode.RateLimited, msg: '请求过于频繁，请稍后重试', data: null, success: false });
}

export function requestRateLimit(max: number, windowMs: number): RequestHandler {
  const counter = new SlidingWindow({ max, windowMs });
  return (req, res, next) => {
    const key = clientKey(req);
    if (counter.remaining(key) <= 0) return reject(res, counter.retryAfter(key));
    counter.add(key);
    next();
  };
}

export function loginFailureLimit(): RequestHandler {
  const byIp = new SlidingWindow({ max: 5, windowMs: 15 * 60_000 });
  const byIpAndAccount = new SlidingWindow({ max: 5, windowMs: 15 * 60_000 });
  return (req, res, next) => {
    const ip = clientKey(req);
    const body = req.body as { username?: unknown; account?: unknown } | undefined;
    const rawAccount = typeof body?.username === 'string' ? body.username : body?.account;
    const account = typeof rawAccount === 'string' ? rawAccount.trim().toLowerCase() : '';
    const accountHash = createHash('sha256').update(account).digest('hex');
    const pair = `${ip}:${accountHash}`;
    if (byIp.remaining(ip) <= 0 || byIpAndAccount.remaining(pair) <= 0) {
      return reject(res, Math.max(byIp.retryAfter(ip), byIpAndAccount.retryAfter(pair)));
    }
    res.once('finish', () => {
      if (res.statusCode === 401) {
        byIp.add(ip);
        byIpAndAccount.add(pair);
      }
    });
    next();
  };
}
