import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/constant/routes';
import { formatDate } from '@/lib/utils/date';
import type { ReportResponse } from '@/types/report';

export function RecentReportsTable({ reports }: { reports: ReportResponse[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أحدث الضبوط</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم</TableHead>
              <TableHead>النموذج</TableHead>
              <TableHead>المُنشئ</TableHead>
              <TableHead>التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState icon={FileText} title="لا توجد ضبوط بعد" />
                </TableCell>
              </TableRow>
            )}
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  <Link to={ROUTES.reports.detail(report.id)} className="hover:underline">
                    {report.reportNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{report.formType.name}</TableCell>
                <TableCell className="text-muted-foreground">{report.creator.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(report.reportDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
