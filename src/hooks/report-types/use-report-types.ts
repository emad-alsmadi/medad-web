import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list, tree } from '@/lib/report-types/api';

export function useReportTypes() {
  return useQuery({
    queryKey: queryKeys.reportTypes.list(),
    queryFn: list,
  });
}

export function useReportTypesTree() {
  return useQuery({
    queryKey: queryKeys.reportTypes.tree(),
    queryFn: tree,
  });
}
