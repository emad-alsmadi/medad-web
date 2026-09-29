import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { create, remove, update } from '@/lib/roles/api';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import type { RoleRequest } from '@/types/role';

/**
 * A role's permissions apply on the backend's very next request, so a
 * change can alter what the signed-in user themselves may do — the users
 * list (role names) and the session are refreshed along with the roles.
 */
function invalidateRoleData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
}

const GRANT_FORBIDDEN = 'لا يمكنك منح صلاحيات لا تملكها.';

/** 400 field errors are shown by the form itself, so they're left alone here. */
function isFieldError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400;
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      invalidateRoleData(queryClient);
      notify.success('تم إنشاء الدور.');
    },
    onError: (error) => {
      if (isFieldError(error)) return;
      if (error instanceof ApiError && error.status === 409) {
        notify.error('اسم الدور مستخدم بالفعل.');
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        notify.error(GRANT_FORBIDDEN);
        return;
      }
      notify.error('فشل إنشاء الدور. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RoleRequest }) => update(id, body),
    onSuccess: () => {
      invalidateRoleData(queryClient);
      notify.success('تم حفظ الدور.');
    },
    onError: (error) => {
      if (isFieldError(error)) return;
      if (error instanceof ApiError && error.status === 409) {
        notify.error(
          'تعذّر الحفظ: اسم الدور مستخدم بالفعل، أو أن هذا دور مدير النظام الذي لا يُعدَّل.',
        );
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        notify.error(GRANT_FORBIDDEN);
        return;
      }
      notify.error('فشل حفظ الدور. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateRoleData(queryClient);
      notify.success('تم حذف الدور.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن حذف دور مدمج أو دور مسند لمستخدمين.');
        return;
      }
      notify.error('فشل حذف الدور. يرجى المحاولة مرة أخرى.');
    },
  });
}
