import { z } from 'zod';
import { RequestLogRepository } from '../repositories/request-log.repository';

export const requestLogQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  method: z.string().trim().regex(/^[A-Za-z]{1,16}$/).transform((value) => value.toUpperCase()).optional(),
  path: z.string().trim().max(500).optional(),
  status: z.coerce.number().int().min(100).max(599).optional(),
});

export const requestLogCleanupSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('ids'), ids: z.array(z.number().int().positive()).min(1).max(500) }),
  z.strictObject({
    mode: z.literal('timeRange'),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
  }).refine((value) => Date.parse(value.startTime) <= Date.parse(value.endTime), {
    path: ['endTime'], message: '结束时间不能早于开始时间',
  }),
]);

export class RequestLogService {
  constructor(private readonly repository: RequestLogRepository) {}

  list(query: z.infer<typeof requestLogQuerySchema>) {
    return this.repository.list(query);
  }

  dashboard(since: string) {
    return this.repository.dashboard(since);
  }

  cleanup(input: z.infer<typeof requestLogCleanupSchema>) {
    const deleted = input.mode === 'ids'
      ? this.repository.deleteByIds([...new Set(input.ids)])
      : this.repository.deleteByTimeRange(
        new Date(input.startTime).toISOString(), new Date(input.endTime).toISOString(),
      );
    return { deleted };
  }
}
