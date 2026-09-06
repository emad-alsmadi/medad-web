import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { fetchCurrentUser } from '@/lib/auth/api';
import { readAccessToken } from '@/lib/session/session';

/**
 * Data-fetching hook: resolves the current authenticated user from the
 * server (never trusts client-persisted profile data). Components
 * consume this — never call lib/auth/api directly.
 */
export function useSession() {
  const hasToken = Boolean(readAccessToken());

  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
