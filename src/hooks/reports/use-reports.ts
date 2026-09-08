import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list } from '@/lib/reports/api';
import type { ReportListParams } from '@/types/report';

export function useReports(params: ReportListParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.list(params),
    queryFn: () => list(params),
    placeholderData: (previousData) => previousData,
  });
}
