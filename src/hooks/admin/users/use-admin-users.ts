import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { fetchAdminUsers } from '@/lib/admin/users/api';
import type { PaginationParams } from '@/types/api';

/**
 * Data-fetching hook for the admin users list. This is the pattern to
 * copy for every future feature: lib/<role>/<feature>/api.ts (pure
 * fetch) -> hooks/<role>/<feature>/use-<feature>.ts (react-query) ->
 * pages/components consume the hook only.
 */
export function useAdminUsers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(params),
    queryFn: () => fetchAdminUsers(params),
    placeholderData: (previousData) => previousData,
  });
}
