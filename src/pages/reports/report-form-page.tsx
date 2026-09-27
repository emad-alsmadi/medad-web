import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useReport } from '@/hooks/reports/use-report';
import { useUpdateReport } from '@/hooks/reports/use-report-mutations';
import { ReportFormActions, ReportFormFields } from '@/components/reports/report-form';
import {
  applyReportFormApiError,
  reportFormValuesToBody,
  reportToFormValues,
  useReportForm,
} from '@/components/reports/report-form-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/notifications/toast';
import { isReportClosedError } from '@/lib/reports/errors';
import { ROUTES } from '@/constant/routes';
import { isReportClosed } from '@/types/report';

export function ReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const navigate = useNavigate();

  const { data: report, isPending: isReportPending } = useReport(reportId);
  const mutation = useUpdateReport(reportId);
  const isClosed = report ? isReportClosed(report) : false;

  const form = useReportForm(report ? reportToFormValues(report) : undefined);
  const { handleSubmit, setError } = form;

  useEffect(() => {
    if (isClosed) notify.info('تم ختم هذا الضبط، فلم يعد قابلًا للتعديل.');
  }, [isClosed]);

  if (!id || Number.isNaN(reportId)) {
    return <Navigate to={ROUTES.reports.list} replace />;
  }

  // A sealed (CLOSED) report is read-only: show it instead of the form.
  if (isClosed) {
    return <Navigate to={`${ROUTES.reports.list}?view=${reportId}`} replace />;
  }

  if (isReportPending) {
    return (
      <Card>
        <CardContent className="space-y-2 p-6" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(reportFormValuesToBody(values), {
      onSuccess: (data) => void navigate(`${ROUTES.reports.list}?view=${data.id}`),
      onError: (error) => {
        if (isReportClosedError(error)) {
          void navigate(`${ROUTES.reports.list}?view=${reportId}`, { replace: true });
          return;
        }
        applyReportFormApiError(error, setError);
      },
    });
  });

  return (
    <>
      <Helmet>
        <title>تعديل الضبط</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>تعديل الضبط {report?.reportNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            <ReportFormFields form={form} isEdit />
            <div className="sticky bottom-0 z-10 -mx-5 -mb-5 rounded-b-xl border-t border-border-subtle bg-card/95 px-5 py-3 backdrop-blur">
              <ReportFormActions
                isPending={mutation.isPending}
                isEdit
                error={form.formState.errors.root?.message}
                onCancel={() => void navigate(`${ROUTES.reports.list}?view=${reportId}`)}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
