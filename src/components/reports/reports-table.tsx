import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constant/routes';
import type { ReportResponse } from '@/types/report';

interface ReportsTableProps {
  reports: ReportResponse[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد تقارير.</p>;
  }

  return (
    <Table>
      <TableCaption className="sr-only">التقارير</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>رقم التقرير</TableHead>
          <TableHead>التاريخ</TableHead>
          <TableHead>النوع</TableHead>
          <TableHead>المُنشئ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>
              <Link
                to={ROUTES.reports.detail(report.id)}
                className="font-medium text-primary hover:underline"
              >
                {report.reportNumber}
              </Link>
            </TableCell>
            <TableCell>{report.reportDate}</TableCell>
            <TableCell>{report.reportType.name}</TableCell>
            <TableCell>{report.creator.fullName}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
