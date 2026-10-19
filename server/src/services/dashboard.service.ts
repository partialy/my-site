import { RequestLogService } from './request-log.service';
import { daysAgo, VisitService } from './visit.service';

export class DashboardService {
  constructor(private readonly visits: VisitService, private readonly requestLogs: RequestLogService) {}

  get() {
    const now = new Date();
    return {
      visits: this.visits.summary(now),
      requestLogs: this.requestLogs.dashboard(new Date(`${daysAgo(now, 6)}T00:00:00.000Z`).toISOString()),
    };
  }
}
