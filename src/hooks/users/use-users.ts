import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list } from '@/lib/users/api';

/**
 * Data-fetching hook for the users list. No pagination params — GET
 * /users returns a plain array with no server-side filtering.
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: list,
  });
}
