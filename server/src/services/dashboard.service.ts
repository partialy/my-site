import { RequestLogService } from './request-log.service';
import { daysAgo, VisitService } from './visit.service';
import { getDemoUserDashboard } from './dashboard-demo-data';

export class DashboardService {
  constructor(private readonly visits: VisitService, private readonly requestLogs: RequestLogService) {}

  get() {
    const now = new Date();
    return {
      visits: this.visits.summary(now),
      users: getDemoUserDashboard(now),
      requestLogs: this.requestLogs.dashboard(new Date(`${daysAgo(now, 6)}T00:00:00.000Z`).toISOString()),
    };
  }
}
