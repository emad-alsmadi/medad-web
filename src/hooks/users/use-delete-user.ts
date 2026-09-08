import { useMutation, useQueryClient } from '@tanstack/react-query';
import { remove } from '@/lib/users/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError } from '@/lib/api/client';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم حذف المستخدم.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن الحذف: يوجد تقارير مرتبطة بهذا المستخدم.');
        return;
      }
      notify.error('فشل حذف المستخدم. يرجى المحاولة مرة أخرى.');
    },
  });
}
