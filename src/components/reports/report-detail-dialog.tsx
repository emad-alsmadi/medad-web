import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Pencil, Printer, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useReport } from '@/hooks/reports/use-report';
import { useReportPdf } from '@/hooks/reports/use-report-mutations';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useAuthContext } from '@/contexts/auth-context';
import { DeleteReportDialog } from '@/components/reports/delete-report-dialog';
import { ReportResultControl } from '@/components/reports/report-result-control';
import { PrintCopyMenuItems } from '@/components/reports/print-copy-menu-items';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/constant/routes';
import { isReportClosed } from '@/types/report';
import type { Confiscation, Party } from '@/types/report';

const TEXT_FIELDS: {
  key: 'summary' | 'introduction' | 'body' | 'conclusion' | 'referral';
  label: string;
}[] = [
  { key: 'summary', label: 'الخلاصة' },
  { key: 'introduction', label: 'المقدمة' },
  { key: 'body', label: 'المتن' },
  { key: 'conclusion', label: 'الخاتمة' },
  { key: 'referral', label: 'الإحالة' },
];

const PARTY_FIELDS: { key: keyof Party; label: string }[] = [
  { key: 'name', label: 'الاسم' },
  { key: 'motherName', label: 'اسم الأم' },
  { key: 'nationalId', label: 'الرقم الوطني' },
  { key: 'origin', label: 'البلد الأصلي' },
  { key: 'residence', label: 'مكان الإقامة' },
];

const CONFISCATION_FIELDS: { key: keyof Confiscation; label: string }[] = [
  { key: 'weapons', label: 'السلاح' },
  { key: 'vehicles', label: 'الآليات' },
  { key: 'drugs', label: 'المخدرات' },
  { key: 'money', label: 'المال' },
  { key: 'seizedItems', label: 'المحجوزات' },
  { key: 'notes', label: 'الملاحظات' },
];

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-border-subtle pt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** Only the filled fields of a party/confiscation, or nothing when it's empty. */
function FilledFields<T extends object>({
  value,
  fields,
}: {
  value: T | null;
  fields: { key: keyof T; label: string }[];
}) {
  const filled = value ? fields.filter(({ key }) => value[key]) : [];
  if (!value || filled.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {filled.map(({ key, label }) => (
        <Item key={String(key)} label={label}>
          {String(value[key])}
        </Item>
      ))}
    </dl>
  );
}

interface ReportDetailDialogProps {
  reportId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailDialog({ reportId, open, onOpenChange }: ReportDetailDialogProps) {
  const { data: report, isPending, isError, refetch } = useReport(reportId ?? Number.NaN);
  const { user } = useAuthContext();
  const { labels } = useReportOptions();
  const [deleting, setDeleting] = useState(false);
  const pdfMutation = useReportPdf();
  const isClosed = report ? isReportClosed(report) : false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogTitle>{report ? `ضبط ${report.reportNumber}` : 'ضبط'}</DialogTitle>

          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={TriangleAlert}
              variant="destructive"
              title="فشل تحميل الضبط"
              description="ربما لم يعد الضبط موجودًا، أو حدث خطأ أثناء التحميل."
              action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
            />
          )}

          {!isError && report && (
            <div className="space-y-4">
              {isClosed && (
                <p className="flex items-center gap-2 rounded-lg bg-syid-umber/10 px-3 py-2 text-sm text-syid-umber">
                  <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  تم ختم هذا الضبط، فهو للقراءة والطباعة فقط.
                </p>
              )}

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Item label="التاريخ">{report.reportDate}</Item>
                <Item label="نوع الضبط">{labels.type(report.type)}</Item>
                <Item label="نموذج الضبط">{report.formType.name}</Item>
                <Item label="النتيجة">
                  <ReportResultControl report={report} />
                </Item>
                <Item label="المُنشئ">{report.creator.fullName}</Item>
                {report.editor && <Item label="آخر تعديل بواسطة">{report.editor.fullName}</Item>}
              </dl>

              <Section title="الجرم">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Item label="نوع الجرم">{report.crimeType?.name ?? 'بدون جرم'}</Item>
                  <Item label="مكان الجرم">{report.crimePlace ?? '—'}</Item>
                  <Item label="تاريخ الجرم">{report.crimeDate ?? '—'}</Item>
                  <Item label="إذاعة البحث">
                    {report.searchBroadcast ? labels.searchBroadcast(report.searchBroadcast) : '—'}
                  </Item>
                  <Item label="إذن النيابة">{report.prosecutionPermission ? 'نعم' : 'لا'}</Item>
                  <Item label="الاكتشاف">{report.discovered ? 'مكتشف' : 'غير مكتشف'}</Item>
                </dl>
              </Section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Section title="المدعي">
                  <FilledFields value={report.plaintiff} fields={PARTY_FIELDS} />
                </Section>
                <Section title="المدعى عليه">
                  <FilledFields value={report.defendant} fields={PARTY_FIELDS} />
                </Section>
              </div>

              <Section title="الإجراء والمصادرات">
                {report.actionTaken && (
                  <dl>
                    <Item label="الإجراء المتخذ">
                      <span className="whitespace-pre-wrap">{report.actionTaken}</span>
                    </Item>
                  </dl>
                )}
                <FilledFields value={report.confiscation} fields={CONFISCATION_FIELDS} />
              </Section>

              {TEXT_FIELDS.some(({ key }) => report[key]) && (
                <Section title="نص ورقة الضبط">
                  <dl className="space-y-4">
                    {TEXT_FIELDS.map(({ key, label }) =>
                      report[key] ? (
                        <Item key={key} label={label}>
                          <span className="whitespace-pre-wrap">{report[key]}</span>
                        </Item>
                      ) : null,
                    )}
                  </dl>
                </Section>
              )}
            </div>
          )}

          {!isError && report && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={pdfMutation.isPending}>
                    <Printer />
                    <span>{pdfMutation.isPending ? 'جاري التحضير…' : 'طباعة ورقة الضبط'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <PrintCopyMenuItems
                    onPrint={(copy) => pdfMutation.mutate({ id: report.id, copy })}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
              {!isClosed && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.reports.edit(report.id)}>
                    <Pencil />
                    <span>تعديل</span>
                  </Link>
                </Button>
              )}
              {user?.role === 'ADMIN' && !isClosed && (
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
