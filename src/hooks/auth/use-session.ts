import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { me } from '@/lib/users/api';
import { persistSessionUser, readAccessToken, readSessionUser } from '@/lib/session/session';
import type { AuthUser } from '@/types/auth';
import type { UserResponse } from '@/types/user';

const SESSION_STALE_MS = 60_000;

function toAuthUser(user: UserResponse): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    permissions: user.permissions!,
  };
}

/**
 * The signed-in user, from GET /users/me. The backend applies role and
 * permission changes on its very next request, so this refreshes on
 * window focus and whenever a request comes back 403 (lib/query). The
 * cookie snapshot is only initial data: an instant first paint after a
 * reload, then revalidated at once. Without a usable snapshot (none, or
 * one from before permissions existed) the query stays pending until
 * /users/me answers, so the guards wait instead of bouncing to /login.
 */
export function useSession() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async (): Promise<AuthUser | null> => {
      if (!readAccessToken()) return null;
      const profile = await me();
      queryClient.setQueryData(queryKeys.users.me, profile);
      const user = toAuthUser(profile);
      persistSessionUser(user);
      return user;
    },
    initialData: () => readSessionUser() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: SESSION_STALE_MS,
    refetchOnWindowFocus: true,
  });
}
