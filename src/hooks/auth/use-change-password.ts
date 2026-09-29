import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePassword, toAuthUser } from '@/lib/auth/api';
import { persistSession } from '@/lib/session/session';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';

/**
 * The backend voids every token issued before the change, this session's included, and
 * returns new ones — stored at once, so only the other sessions are signed out.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      const user = toAuthUser(data);
      persistSession({ user, token: data.token, refreshToken: data.refreshToken });
      queryClient.setQueryData(queryKeys.auth.session, user);
      notify.success('تم تغيير كلمة المرور، وسُجّل خروجك من الأجهزة الأخرى.');
    },
  });
}
