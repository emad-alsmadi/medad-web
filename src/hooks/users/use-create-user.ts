import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from '@/lib/users/api';
import { register } from '@/lib/auth/api';
import { userActionErrorMessage } from '@/lib/users/errors';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import type { RegisterRequest } from '@/types/user';

export interface NewUser extends RegisterRequest {
  /** Omitted when the creator can't list roles: the account then gets «مستخدم» via /auth/register. */
  roleId?: number;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, ...body }: NewUser) =>
      roleId === undefined ? register(body) : create({ ...body, roleId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم إنشاء المستخدم.');
    },
    onError: (error) => {
      notify.error(
        userActionErrorMessage(error, {
          conflict: 'هذا البريد الإلكتروني مستخدم بالفعل.',
          fallback: 'فشل إنشاء المستخدم. يرجى المحاولة مرة أخرى.',
        }),
      );
    },
  });
}
