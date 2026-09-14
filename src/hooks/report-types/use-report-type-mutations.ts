import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create, remove, update } from '@/lib/report-types/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError } from '@/lib/api/client';

function invalidateReportTypes(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportTypes.all });
}

export function useCreateReportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      invalidateReportTypes(queryClient);
      notify.success('تم إنشاء نوع الضبط.');
    },
    onError: () => {
      notify.error('فشل إنشاء نوع الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useUpdateReportType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      invalidateReportTypes(queryClient);
      notify.success('تم تحديث نوع الضبط.');
    },
    onError: () => {
      notify.error('فشل تحديث نوع الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateReportTypes(queryClient);
      notify.success('تم حذف نوع الضبط.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن الحذف: يحتوي هذا النوع على أنواع فرعية أو ضبوط مرتبطة به.');
        return;
      }
      notify.error('فشل حذف نوع الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}
