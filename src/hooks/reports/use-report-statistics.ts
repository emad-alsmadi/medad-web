import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { statistics } from '@/lib/reports/api';
import type { StatisticsRange } from '@/types/report-statistics';

export function useReportStatistics(range: StatisticsRange = {}) {
  return useQuery({
    queryKey: queryKeys.reports.statistics({ ...range }),
    queryFn: () => statistics(range),
    placeholderData: (previousData) => previousData,
  });
}
