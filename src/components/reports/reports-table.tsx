import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MoreVertical, Pencil, Printer, Trash2 } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteReportDialog } from '@/components/reports/delete-report-dialog';
import { ReportDetailDialog } from '@/components/reports/report-detail-dialog';
import { useReportPdf } from '@/hooks/reports/use-report-mutations';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';
import type { ReportResponse } from '@/types/report';

interface ReportsTableProps {
  reports: ReportResponse[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const { user } = useAuthContext();
  const canDelete = user?.role === 'ADMIN';
  const [deleteReport, setDeleteReport] = useState<ReportResponse | null>(null);
  const [detailReportId, setDetailReportId] = useState<number | null>(null);
  const pdfMutation = useReportPdf();

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد ضبوط.</p>;
  }

  return (
    <>
      <Table>
        <TableCaption className="sr-only">الضبوط</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الضبط</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>المُنشئ</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
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
              <TableCell>{report.reportDate}</TableCell>
              <TableCell>{report.reportType.name}</TableCell>
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
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.reports.edit(report.id)}>
                        <Pencil />
                        <span>تعديل</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => pdfMutation.mutate(report.id)}>
                      <Printer />
                      <span>طباعة نموذج الضبط</span>
                    </DropdownMenuItem>
                    {canDelete && (
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
          ))}
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
