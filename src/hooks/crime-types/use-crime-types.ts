import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list } from '@/lib/crime-types/api';

export function useCrimeTypes() {
  return useQuery({
    queryKey: queryKeys.crimeTypes.list(),
    queryFn: list,
  });
}
