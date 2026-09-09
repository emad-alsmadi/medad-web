import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create, remove, update } from '@/lib/reports/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError } from '@/lib/api/client';

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم إنشاء التقرير.');
    },
    onError: () => {
      notify.error('فشل إنشاء التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useUpdateReport(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم تحديث التقرير.');
    },
    onError: () => {
      notify.error('فشل تحديث التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم حذف التقرير.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        notify.error('ليس لديك صلاحية لحذف هذا التقرير.');
        return;
      }
      notify.error('فشل حذف التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}
