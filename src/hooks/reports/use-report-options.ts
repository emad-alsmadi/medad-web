import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { options } from '@/lib/reports/api';
import type { EnumOption, ReportResult, ReportType, SearchBroadcast } from '@/types/report';

/** Shown for a report whose type/result predates the field (null). */
export const UNSPECIFIED_LABEL = 'غير محدد';

function labelFrom<T extends string>(list: EnumOption<T>[] | undefined) {
  return (value: T | null): string =>
    value === null ? UNSPECIFIED_LABEL : (list?.find((o) => o.value === value)?.label ?? value);
}

/**
 * The fixed enum values (نوع الضبط، إذاعة البحث، النتيجة) with their
 * Arabic labels, from GET /reports/options. They only change with a
 * backend release, so they're fetched once per session.
 */
export function useReportOptions() {
  const query = useQuery({
    queryKey: queryKeys.reports.options(),
    queryFn: options,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const { data } = query;

  const labels = useMemo(
    () => ({
      type: labelFrom<ReportType>(data?.types),
      searchBroadcast: labelFrom<SearchBroadcast>(data?.searchBroadcasts),
      result: labelFrom<ReportResult>(data?.results),
    }),
    [data],
  );

  return { ...query, labels };
}
