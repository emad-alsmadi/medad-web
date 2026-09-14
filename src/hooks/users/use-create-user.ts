import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from '@/lib/users/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError } from '@/lib/api/client';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم إنشاء المستخدم.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('هذا البريد الإلكتروني مستخدم بالفعل.');
        return;
      }
      notify.error('فشل إنشاء المستخدم. يرجى المحاولة مرة أخرى.');
    },
  });
}
