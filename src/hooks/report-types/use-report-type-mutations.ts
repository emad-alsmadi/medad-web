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
      notify.success('تم إنشاء نوع التقرير.');
    },
    onError: () => {
      notify.error('فشل إنشاء نوع التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useUpdateReportType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      invalidateReportTypes(queryClient);
      notify.success('تم تحديث نوع التقرير.');
    },
    onError: () => {
      notify.error('فشل تحديث نوع التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateReportTypes(queryClient);
      notify.success('تم حذف نوع التقرير.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن الحذف: يحتوي هذا النوع على أنواع فرعية أو تقارير مرتبطة به.');
        return;
      }
      notify.error('فشل حذف نوع التقرير. يرجى المحاولة مرة أخرى.');
    },
  });
}
