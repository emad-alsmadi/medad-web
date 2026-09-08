import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { readSessionUser } from '@/lib/session/session';

/**
 * There is no /auth/me — the user profile only ever comes from the
 * /auth/login response and is persisted in a cookie (see lib/session).
 * This hook just exposes that persisted value through react-query so
 * components get the familiar {data, isLoading} shape and use-login can
 * seed the same query key on sign-in.
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => readSessionUser(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
