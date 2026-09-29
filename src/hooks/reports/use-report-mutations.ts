import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeResult, create, exportExcel, getPdf, remove, update } from '@/lib/reports/api';
import { isReportClosedError } from '@/lib/reports/errors';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { failureMessage } from '@/lib/api/errors';
import { downloadBlob, openBlob } from '@/lib/utils/download';
import { ApiError } from '@/lib/api/client';
import type { ReportFilterParams, ReportResult } from '@/types/report';

const CLOSED_MESSAGE = 'تم ختم هذا الضبط، ولم يعد قابلًا للتعديل أو الحذف.';

function invalidateReports(queryClient: ReturnType<typeof useQueryClient>) {
  // Also covers reports.detail and reports.statistics.
  void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      invalidateReports(queryClient);
      notify.success('تم إنشاء الضبط.');
    },
    onError: (error) => {
      // 400/409 field errors are shown under the fields by the form itself.
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) return;
      notify.error(failureMessage(error, 'فشل إنشاء الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}

export function useUpdateReport(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      invalidateReports(queryClient);
      notify.success('تم تحديث الضبط.');
    },
    onError: (error) => {
      if (isReportClosedError(error)) {
        invalidateReports(queryClient);
        notify.error(CLOSED_MESSAGE);
        return;
      }
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) return;
      notify.error(failureMessage(error, 'فشل تحديث الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}

/** Changes only the result. Moving to CLOSED is final. */
export function useChangeReportResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, result }: { id: number; result: ReportResult }) => changeResult(id, result),
    onSuccess: (report) => {
      queryClient.setQueryData(queryKeys.reports.detail(report.id), report);
      invalidateReports(queryClient);
      notify.success(report.result === 'CLOSED' ? 'تم ختم الضبط.' : 'تم تغيير نتيجة الضبط.');
    },
    onError: (error) => {
      if (isReportClosedError(error)) {
        invalidateReports(queryClient);
        notify.error(CLOSED_MESSAGE);
        return;
      }
      notify.error(failureMessage(error, 'فشل تغيير نتيجة الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateReports(queryClient);
      notify.success('تم حذف الضبط.');
    },
    onError: (error) => {
      if (isReportClosedError(error)) {
        invalidateReports(queryClient);
        notify.error(CLOSED_MESSAGE);
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        notify.error('ليس لديك صلاحية لحذف هذا الضبط.');
        return;
      }
      notify.error(failureMessage(error, 'فشل حذف الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}

/** Opens the printable "ورقة ضبط" PDF for a report in a new tab. */
export function useReportPdf() {
  return useMutation({
    mutationFn: ({ id, copy }: { id: number; copy?: number }) => getPdf(id, copy),
    onSuccess: openBlob,
    onError: (error) => {
      notify.error(failureMessage(error, 'فشل تحميل نموذج الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}

/** Downloads سجل الضبوط (.xlsx) for the given list filters. */
export function useExportReports() {
  return useMutation({
    mutationFn: (filters: ReportFilterParams) => exportExcel(filters),
    onSuccess: (blob) => {
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `سجل-الضبوط-${today}.xlsx`);
    },
    onError: (error) => {
      notify.error(failureMessage(error, 'فشل تصدير سجل الضبوط. يرجى المحاولة مرة أخرى.'));
    },
  });
}
