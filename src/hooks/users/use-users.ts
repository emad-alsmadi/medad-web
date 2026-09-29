import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list } from '@/lib/users/api';

/**
 * Data-fetching hook for the users list. No pagination params — GET
 * /users returns a plain array with no server-side filtering. `enabled:
 * false` for users without USERS:VIEW, who'd only get a 403.
 */
export function useUsers({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: list,
    enabled,
  });
}
