import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setRole } from '@/lib/users/api';
import { userActionErrorMessage } from '@/lib/users/errors';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: number }) => setRole(id, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم تغيير دور المستخدم.');
    },
    onError: (error) => {
      notify.error(
        userActionErrorMessage(error, {
          conflict: 'تعذّر تغيير الدور.',
          fallback: 'فشل تغيير الدور. يرجى المحاولة مرة أخرى.',
        }),
      );
    },
  });
}
