import { useMutation, useQueryClient } from '@tanstack/react-query';
import { remove } from '@/lib/users/api';
import { userActionErrorMessage } from '@/lib/users/errors';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم حذف المستخدم.');
    },
    onError: (error) => {
      notify.error(
        userActionErrorMessage(error, {
          conflict: 'لا يمكن الحذف: يوجد ضبوط مرتبطة بهذا المستخدم.',
          fallback: 'فشل حذف المستخدم. يرجى المحاولة مرة أخرى.',
        }),
      );
    },
  });
}
