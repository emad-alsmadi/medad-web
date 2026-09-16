import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { get } from '@/lib/report-templates/api';
import { ApiError } from '@/lib/api/client';

/**
 * A report type may not have a template configured yet — the backend
 * returns 404 in that case, which callers should treat as "no template"
 * rather than a query error (see isNotFound below).
 */
export function useReportTemplate(reportTypeId: number) {
  const query = useQuery({
    queryKey: queryKeys.reportTemplates.detail(reportTypeId),
    queryFn: () => get(reportTypeId),
    enabled: Number.isFinite(reportTypeId),
  });

  const isNotFound = query.error instanceof ApiError && query.error.status === 404;

  return { ...query, isNotFound };
}
