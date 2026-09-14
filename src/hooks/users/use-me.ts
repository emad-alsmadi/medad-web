import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { me } from '@/lib/users/api';

/**
 * GET /users/me — the full UserResponse (including reportInfo) for the
 * signed-in user. Distinct from useSession, which only exposes the
 * AuthUser fields persisted from the /auth/login response.
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: me,
  });
}
