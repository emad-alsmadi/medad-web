import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { get } from '@/lib/reports/api';

export function useReport(id: number) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => get(id),
    enabled: Number.isFinite(id),
  });
}
