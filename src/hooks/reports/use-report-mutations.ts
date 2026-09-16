import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create, getPdf, remove, update } from '@/lib/reports/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { ApiError } from '@/lib/api/client';

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم إنشاء الضبط.');
    },
    onError: () => {
      notify.error('فشل إنشاء الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useUpdateReport(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم تحديث الضبط.');
    },
    onError: () => {
      notify.error('فشل تحديث الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      notify.success('تم حذف الضبط.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        notify.error('ليس لديك صلاحية لحذف هذا الضبط.');
        return;
      }
      notify.error('فشل حذف الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

/** Opens the printable "ورقة ضبط" PDF for a report in a new tab. */
export function useReportPdf() {
  return useMutation({
    mutationFn: getPdf,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Revoke after giving the new tab time to load the blob URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: () => {
      notify.error('فشل تحميل نموذج الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}
