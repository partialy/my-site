import { z } from 'zod';
import { RequestLogRepository } from '../repositories/request-log.repository';

export const requestLogQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  method: z.string().trim().regex(/^[A-Za-z]{1,16}$/).transform((value) => value.toUpperCase()).optional(),
  path: z.string().trim().max(500).optional(),
  status: z.coerce.number().int().min(100).max(599).optional(),
});

export class RequestLogService {
  constructor(private readonly repository: RequestLogRepository) {}

  list(query: z.infer<typeof requestLogQuerySchema>) {
    return this.repository.list(query);
  }

  dashboard(since: string) {
    return this.repository.dashboard(since);
  }
}
