import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/lib/auth/api';
import { persistSession } from '@/lib/session/session';
import { queryKeys } from '@/lib/query/query-keys';
import type { AuthUser } from '@/types/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user: AuthUser = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      };
      persistSession({ user, token: data.token, refreshToken: data.refreshToken });
      queryClient.setQueryData(queryKeys.auth.session, user);
    },
  });
}
