import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list } from '@/lib/crime-types/api';

/** `enabled: false` for users without CRIME_TYPES:VIEW, who'd only get a 403. */
export function useCrimeTypes({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.crimeTypes.list(),
    queryFn: list,
    enabled,
  });
}
