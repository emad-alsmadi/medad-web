import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create, remove, update } from '@/lib/crime-types/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { failureMessage } from '@/lib/api/errors';
import { ApiError } from '@/lib/api/client';

function invalidateCrimeTypes(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.crimeTypes.all });
}

/** 409 on create/update means the name is taken — the form shows it under the field. */
export function useCreateCrimeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      invalidateCrimeTypes(queryClient);
      notify.success('تم إنشاء نوع الجرم.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) return;
      notify.error(failureMessage(error, 'فشل إنشاء نوع الجرم. يرجى المحاولة مرة أخرى.'));
    },
  });
}

export function useUpdateCrimeType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      invalidateCrimeTypes(queryClient);
      // Reports embed the crime type's name.
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم تحديث نوع الجرم.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) return;
      notify.error(failureMessage(error, 'فشل تحديث نوع الجرم. يرجى المحاولة مرة أخرى.'));
    },
  });
}

export function useDeleteCrimeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateCrimeTypes(queryClient);
      notify.success('تم حذف نوع الجرم.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن الحذف: هناك ضبوط مرتبطة بهذا النوع.');
        return;
      }
      notify.error(failureMessage(error, 'فشل حذف نوع الجرم. يرجى المحاولة مرة أخرى.'));
    },
  });
}
