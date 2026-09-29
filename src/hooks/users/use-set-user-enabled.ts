import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setEnabled } from '@/lib/users/api';
import { userActionErrorMessage } from '@/lib/users/errors';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import type { UserResponse } from '@/types/user';

/** The switch flips at once and snaps back if the backend refuses. */
export function useSetUserEnabled() {
  const queryClient = useQueryClient();
  const listKey = queryKeys.users.list();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => setEnabled(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<UserResponse[]>(listKey);
      queryClient.setQueryData<UserResponse[]>(listKey, (users) =>
        users?.map((user) => (user.id === id ? { ...user, enabled } : user)),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(listKey, context?.previous);
      notify.error(
        userActionErrorMessage(error, {
          conflict: 'تعذّر تغيير حالة الحساب.',
          fallback: 'فشل تغيير حالة الحساب. يرجى المحاولة مرة أخرى.',
        }),
      );
    },
    onSuccess: (user) => {
      notify.success(user.enabled ? 'تم تفعيل الحساب.' : 'تم تعطيل الحساب.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
