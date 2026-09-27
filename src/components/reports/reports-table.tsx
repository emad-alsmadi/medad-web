import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, MoreVertical, Pencil, Printer, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/empty-state';
import { DeleteReportDialog } from '@/components/reports/delete-report-dialog';
import { ReportDetailDialog } from '@/components/reports/report-detail-dialog';
import { ReportResultControl } from '@/components/reports/report-result-control';
import { PrintCopyMenuItems } from '@/components/reports/print-copy-menu-items';
import { useReportPdf } from '@/hooks/reports/use-report-mutations';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';
import { isReportClosed } from '@/types/report';
import type { ReportResponse } from '@/types/report';

const COLUMN_COUNT = 8;

interface ReportsTableProps {
  reports: ReportResponse[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const { user } = useAuthContext();
  const canDelete = user?.role === 'ADMIN';
  const [deleteReport, setDeleteReport] = useState<ReportResponse | null>(null);
  const [detailReportId, setDetailReportId] = useState<number | null>(null);
  const pdfMutation = useReportPdf();
  const { labels } = useReportOptions();

  return (
    <>
      <Table>
        <TableCaption className="sr-only">الضبوط</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الضبط</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>نوع الضبط</TableHead>
            <TableHead>نموذج الضبط</TableHead>
            <TableHead>نوع الجرم</TableHead>
            <TableHead>النتيجة</TableHead>
            <TableHead>المُنشئ</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="p-0">
                <EmptyState icon={FileText} title="لا توجد ضبوط" />
              </TableCell>
            </TableRow>
          )}
          {reports.map((report) => {
            const isClosed = isReportClosed(report);
            return (
              <TableRow
                key={report.id}
                onClick={() => setDetailReportId(report.id)}
                className="cursor-pointer"
              >
                <TableCell>
                  <span className="font-medium text-primary hover:underline">
                    {report.reportNumber}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{report.reportDate}</TableCell>
                <TableCell>{labels.type(report.type)}</TableCell>
                <TableCell>{report.formType.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {report.crimeType?.name ?? '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ReportResultControl report={report} />
                </TableCell>
                <TableCell>{report.creator.fullName}</TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="إجراءات الضبط">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDetailReportId(report.id)}>
                        <Eye />
                        <span>عرض التفاصيل</span>
                      </DropdownMenuItem>
                      {!isClosed && (
                        <DropdownMenuItem asChild>
                          <Link to={ROUTES.reports.edit(report.id)}>
                            <Pencil />
                            <span>تعديل</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Printer className="h-4 w-4 text-muted-foreground" />
                          <span>طباعة ورقة الضبط</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <PrintCopyMenuItems
                            onPrint={(copy) => pdfMutation.mutate({ id: report.id, copy })}
                          />
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      {canDelete && !isClosed && (
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteReport(report)}
                        >
                          <Trash2 />
                          <span>حذف</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {deleteReport && (
        <DeleteReportDialog
          report={deleteReport}
          open
          onOpenChange={(open) => !open && setDeleteReport(null)}
        />
      )}

      <ReportDetailDialog
        reportId={detailReportId}
        open={detailReportId !== null}
        onOpenChange={(open) => !open && setDetailReportId(null)}
      />
    </>
  );
}
