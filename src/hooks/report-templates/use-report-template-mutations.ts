import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPdf, remove, save } from '@/lib/report-templates/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { openBlob } from '@/lib/utils/download';

function invalidateReportTemplate(
  queryClient: ReturnType<typeof useQueryClient>,
  formTypeId: number,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportTemplates.detail(formTypeId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportTemplates.list() });
}

export function useSaveReportTemplate(formTypeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof save>[1]) => save(formTypeId, body),
    onSuccess: () => {
      invalidateReportTemplate(queryClient, formTypeId);
      notify.success('تم حفظ نص النموذج.');
    },
    onError: () => {
      notify.error('فشل حفظ نص النموذج. يرجى المحاولة مرة أخرى.');
    },
  });
}

export function useDeleteReportTemplate(formTypeId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => remove(formTypeId),
    onSuccess: () => {
      invalidateReportTemplate(queryClient, formTypeId);
      notify.success('تم حذف نص النموذج.');
    },
    onError: () => {
      notify.error('فشل حذف نص النموذج. يرجى المحاولة مرة أخرى.');
    },
  });
}

/** Opens the blank printable template PDF for a form type in a new tab. */
export function useReportTemplatePdf() {
  return useMutation({
    mutationFn: getPdf,
    onSuccess: openBlob,
    onError: () => {
      notify.error('فشل تحميل نموذج الضبط الفارغ. يرجى المحاولة مرة أخرى.');
    },
  });
}
