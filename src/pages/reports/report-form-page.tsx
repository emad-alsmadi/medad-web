import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useReport } from '@/hooks/reports/use-report';
import { useUpdateReport } from '@/hooks/reports/use-report-mutations';
import {
  ReportFormFields,
  ReportFormSubmitButton,
  reportFormValuesToBody,
  reportToFormValues,
  applyReportFormApiError,
  useReportForm,
} from '@/components/reports/report-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';

export function ReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const navigate = useNavigate();

  const { data: report, isPending: isReportPending } = useReport(reportId);
  const mutation = useUpdateReport(reportId);

  const form = useReportForm(report ? reportToFormValues(report) : undefined);
  const { handleSubmit, setError } = form;

  if (!id || Number.isNaN(reportId)) {
    return <Navigate to={ROUTES.reports.list} replace />;
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
      onError: (error) => applyReportFormApiError(error, setError),
    });
  });

  return (
    <>
      <Helmet>
        <title>تعديل الضبط</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>تعديل الضبط</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            <ReportFormFields form={form} />
            <ReportFormSubmitButton isPending={mutation.isPending} isEdit />
          </form>
        </CardContent>
      </Card>
    </>
  );
}
