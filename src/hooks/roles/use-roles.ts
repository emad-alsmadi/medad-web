import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { list, options } from '@/lib/roles/api';

/** `enabled: false` for users without ROLES:VIEW, who'd only get a 403. */
export function useRoles({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.roles.list(),
    queryFn: list,
    enabled,
  });
}

/** The permission matrix's rows and columns — fixed per backend release. */
export function useRoleOptions() {
  return useQuery({
    queryKey: queryKeys.roles.options(),
    queryFn: options,
    staleTime: Infinity,
  });
}
