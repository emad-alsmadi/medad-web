import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROUTES } from '@/constant/routes';
import type { ReportResponse } from '@/types/report';

export function RecentReportsTable({ reports }: { reports: ReportResponse[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أحدث الضبوط</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد ضبوط بعد</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المحرر</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <Link to={ROUTES.reports.detail(report.id)} className="hover:underline">
                      {report.reportNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.reportType.name}</TableCell>
                  <TableCell className="text-muted-foreground">{report.creator.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{report.reportDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
