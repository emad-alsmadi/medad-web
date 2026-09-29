import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { me } from '@/lib/users/api';

/**
 * GET /users/me — the full UserResponse (including reportInfo) for the
 * signed-in user. useSession fetches the same endpoint and seeds this
 * cache, so the profile page usually renders without a second request.
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: me,
  });
}
