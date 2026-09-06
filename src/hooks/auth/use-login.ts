import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/lib/auth/api';
import { persistAccessToken } from '@/lib/session/session';
import { queryKeys } from '@/lib/query/query-keys';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      persistAccessToken(data.accessToken);
      queryClient.setQueryData(queryKeys.auth.session, data.user);
    },
  });
}
