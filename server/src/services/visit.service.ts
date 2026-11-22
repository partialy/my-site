import { z } from 'zod';
import { VisitRepository } from '../repositories/visit.repository';
import { paginationQueryShape } from '../shared/pagination';

export const visitInputSchema = z.strictObject({
  visitorId: z.uuid(),
  path: z.string().trim().min(1).max(500).regex(/^\/(?!\/)[^?#\\]*$/, '请输入站内绝对路径'),
  pageTitle: z.string().trim().max(150).optional(),
  referrer: z.url().max(1000).optional(),
});

const daySchema = z.iso.date();
export const visitQuerySchema = z.strictObject({
  ...paginationQueryShape,
  path: z.string().trim().max(500).optional(),
  visitorId: z.string().trim().max(36).optional(),
  startDay: daySchema.optional(),
  endDay: daySchema.optional(),
}).refine((query) => !query.startDay || !query.endDay || query.startDay <= query.endDay, {
  path: ['endDay'], message: '结束日期不能早于开始日期',
});

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysAgo(date: Date, days: number): string {
  const target = new Date(date);
  target.setUTCDate(target.getUTCDate() - days);
  return utcDay(target);
}

export class VisitService {
  constructor(private readonly repository: VisitRepository) {}

  list(query: z.infer<typeof visitQuerySchema>) {
    return this.repository.list(query);
  }

  record(input: z.infer<typeof visitInputSchema>, visitor: { ip: string | null; userAgent: string | null }) {
    const now = new Date();
    const day = utcDay(now);
    const recorded = this.repository.create({
      day, visitorId: input.visitorId, path: input.path, pageTitle: input.pageTitle ?? '',
      referrer: input.referrer ? new URL(input.referrer).origin : '',
      ip: visitor.ip, userAgent: visitor.userAgent,
      createdAt: now.toISOString(),
    });
    return { recorded, day };
  }

  summary(now = new Date()) {
    const today = utcDay(now);
    const yesterday = daysAgo(now, 1);
    const last7Start = daysAgo(now, 6);
    const last30Start = daysAgo(now, 29);
    const counts = new Map(this.repository.trendSince(last30Start).map((point) => [point.day, point.visits]));
    const trend = (days: number) => Array.from({ length: days }, (_, index) => {
      const day = daysAgo(now, days - index - 1);
      return { day, visits: counts.get(day) ?? 0 };
    });
    return {
      today: this.repository.count(today), yesterday: this.repository.count(yesterday),
      last7Days: this.repository.countSince(last7Start),
      trend7: trend(7), trend30: trend(30),
    };
  }
}
