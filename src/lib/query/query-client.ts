import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';

/**
 * A 403 usually means the user's role changed mid-session (the backend
 * applies that immediately) — refetch the session so buttons and links
 * catch up. Never a logout: the session itself is still valid.
 */
function resyncPermissionsOnForbidden(error: Error): void {
  if (error instanceof ApiError && error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
  }
}

/**
 * Single shared QueryClient instance. Defaults tuned conservatively for
 * a government data system: no retry on 4xx (client/auth errors),
 * moderate retry on transient network/5xx failures.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: resyncPermissionsOnForbidden }),
  mutationCache: new MutationCache({ onError: resyncPermissionsOnForbidden }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
