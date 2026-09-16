import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPdf, remove, save } from '@/lib/report-templates/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';

function invalidateReportTemplate(
  queryClient: ReturnType<typeof useQueryClient>,
  reportTypeId: number,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportTemplates.detail(reportTypeId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportTemplates.list() });
}

export function useSaveReportTemplate(reportTypeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof save>[1]) => save(reportTypeId, body),
    onSuccess: () => {
      invalidateReportTemplate(queryClient, reportTypeId);
      notify.success('تم حفظ نموذج الضبط.');
    },
    onError: () => {
      notify.error('فشل حفظ نموذج الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReportTemplate(reportTypeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => remove(reportTypeId),
    onSuccess: () => {
      invalidateReportTemplate(queryClient, reportTypeId);
      notify.success('تم حذف نموذج الضبط.');
    },
    onError: () => {
      notify.error('فشل حذف نموذج الضبط. يرجى المحاولة مرة أخرى.');
    },
  });
}

/** Opens the blank printable template PDF for a report type in a new tab. */
export function useReportTemplatePdf() {
  return useMutation({
    mutationFn: getPdf,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: () => {
      notify.error('فشل تحميل نموذج الضبط الفارغ. يرجى المحاولة مرة أخرى.');
    },
  });
}
