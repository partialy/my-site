import type { TableListResource } from '../table-list.repository';

export const visitListResource: TableListResource = {
  table: 'visit',
  columns: ['id', 'visit_day', 'visitor_id', 'path', 'page_title', 'referrer', 'ip', 'user_agent', 'created_at'],
  orderBy: 'id', order: 'DESC',
  containsFilters: { path: 'path', visitorId: 'visitor_id' },
  rangeFilters: {
    startDay: { column: 'visit_day', operator: '>=' },
    endDay: { column: 'visit_day', operator: '<=' },
  },
};
