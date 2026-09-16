import { Link } from 'react-router-dom';
import { Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useReport } from '@/hooks/reports/use-report';
import { useReportPdf } from '@/hooks/reports/use-report-mutations';
import { useAuthContext } from '@/contexts/auth-context';
import { DeleteReportDialog } from '@/components/reports/delete-report-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';

const FIELDS: {
  key: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
}[] = [
  { key: 'introduction', label: 'المقدمة' },
  { key: 'body', label: 'المتن' },
  { key: 'referral', label: 'الإحالة' },
  { key: 'conclusion', label: 'الخاتمة' },
  { key: 'summary', label: 'الملخص' },
];

interface ReportDetailDialogProps {
  reportId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailDialog({ reportId, open, onOpenChange }: ReportDetailDialogProps) {
  const { data: report, isPending, isError } = useReport(reportId ?? Number.NaN);
  const { user } = useAuthContext();
  const [deleting, setDeleting] = useState(false);
  const pdfMutation = useReportPdf();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>{report ? `ضبط ${report.reportNumber}` : 'ضبط'}</DialogTitle>

          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل الضبط. ربما لم يعد موجودًا.
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

          {report && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pdfMutation.isPending}
                onClick={() => pdfMutation.mutate(report.id)}
              >
                <Printer />
                <span>{pdfMutation.isPending ? 'جاري التحضير…' : 'طباعة نموذج الضبط'}</span>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.reports.edit(report.id)}>
                  <Pencil />
                  <span>تعديل</span>
                </Link>
              </Button>
              {user?.role === 'ADMIN' && (
                <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
                  <Trash2 />
                  <span>حذف</span>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {report && deleting && (
        <DeleteReportDialog
          report={report}
          open
          onOpenChange={setDeleting}
          onDeleted={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
