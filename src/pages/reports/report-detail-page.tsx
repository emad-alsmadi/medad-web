import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useReport } from '@/hooks/reports/use-report';
import { useAuthContext } from '@/contexts/auth-context';
import { DeleteReportDialog } from '@/components/reports/delete-report-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';

const FIELDS: {
  key: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
}[] = [
  { key: 'introduction', label: 'المقدمة' },
  { key: 'body', label: 'النص' },
  { key: 'referral', label: 'الإحالة' },
  { key: 'conclusion', label: 'الخاتمة' },
  { key: 'summary', label: 'الملخص' },
];

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const { data: report, isPending, isError } = useReport(reportId);
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  if (!id || Number.isNaN(reportId)) {
    return <Navigate to={ROUTES.reports.list} replace />;
  }

  return (
    <>
      <Helmet>
        <title>{report ? `تقرير ${report.reportNumber}` : 'تقرير'}</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{report ? `تقرير ${report.reportNumber}` : 'تقرير'}</CardTitle>
          {report && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.reports.edit(report.id)}>تعديل</Link>
              </Button>
              {user?.role === 'ADMIN' && (
                <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
                  حذف
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل التقرير. ربما لم يعد موجودًا.
            </p>
          )}

          {report && (
            <dl className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">التاريخ</dt>
                  <dd>{report.reportDate}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">النوع</dt>
                  <dd>{report.reportType.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">المُنشئ</dt>
                  <dd>{report.creator.fullName}</dd>
                </div>
                {report.editor && (
                  <div>
                    <dt className="text-sm text-muted-foreground">آخر تعديل بواسطة</dt>
                    <dd>{report.editor.fullName}</dd>
                  </div>
                )}
              </div>
              {FIELDS.map(({ key, label }) =>
                report[key] ? (
                  <div key={key}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="whitespace-pre-wrap">{report[key]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      {report && deleting && (
        <DeleteReportDialog
          report={report}
          open
          onOpenChange={setDeleting}
          onDeleted={() => void navigate(ROUTES.reports.list)}
        />
      )}
    </>
  );
}
