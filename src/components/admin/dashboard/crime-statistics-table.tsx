import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReportResult } from '@/types/report';
import type { StatisticItem } from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');
const RESULT_COLUMNS: ReportResult[] = ['UNDER_INVESTIGATION', 'FURTHER_INVESTIGATION', 'CLOSED'];

interface CrimeStatisticsTableProps {
  items: StatisticItem<number>[];
  /** Arabic label of each result column. */
  resultLabel: (result: ReportResult) => string;
  /** Link to a crime type's reports, or undefined for «بدون جرم» (not filterable). */
  hrefFor: (item: StatisticItem<number>) => string | undefined;
}

function countOf<K>(list: StatisticItem<K>[] | undefined, key: K): number {
  return list?.find((item) => item.key === key)?.count ?? 0;
}

/**
 * The classic crime register table: each crime type (non-zero ones, then
 * «بدون جرم») with how many were discovered and where they stand — read
 * straight from each row's `details`.
 */
export function CrimeStatisticsTable({ items, resultLabel, hrefFor }: CrimeStatisticsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الضبوط حسب نوع الجرم</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">
            عدد الضبوط لكل نوع جرم مع الاكتشاف والنتيجة
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>نوع الجرم</TableHead>
              <TableHead className="text-center">المجموع</TableHead>
              <TableHead className="text-center">مكتشف</TableHead>
              <TableHead className="text-center">غير مكتشف</TableHead>
              {RESULT_COLUMNS.map((result) => (
                <TableHead key={result} className="text-center">
                  {resultLabel(result)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const href = hrefFor(item);
              const { byDiscovered, byResult } = item.details ?? {};
              return (
                <TableRow key={String(item.key)}>
                  <TableCell className="font-medium">
                    {href ? (
                      <Link to={href} className="hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{item.label}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold tabular-nums">
                    {NUMBER_FORMAT.format(item.count)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {NUMBER_FORMAT.format(countOf(byDiscovered, true))}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {NUMBER_FORMAT.format(countOf(byDiscovered, false))}
                  </TableCell>
                  {RESULT_COLUMNS.map((result) => (
                    <TableCell key={result} className="text-center tabular-nums">
                      {NUMBER_FORMAT.format(countOf(byResult, result))}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
