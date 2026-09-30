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
import { cn } from '@/lib/utils/cn';
import type { ReportResult } from '@/types/report';
import type { StatisticItem } from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');
// null (no result set) gets its own column, so each row's result columns add up to its total.
const RESULT_COLUMNS: (ReportResult | null)[] = [
  'UNDER_INVESTIGATION',
  'FURTHER_INVESTIGATION',
  'CLOSED',
  null,
];

interface CrimeStatisticsTableProps {
  items: StatisticItem<number>[];
  /** Arabic label of each result column. */
  resultLabel: (result: ReportResult | null) => string;
  /** Link to a crime type's reports, or undefined for «بدون جرم» (not filterable). */
  hrefFor: (item: StatisticItem<number>) => string | undefined;
}

// Frozen header row and crime-type column: sticky cells need an opaque background to cover
// what scrolls beneath them.
const FROZEN_HEAD =
  'sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--color-border-subtle)]';
const FROZEN_COLUMN = 'sticky start-0';

function countOf<K>(list: StatisticItem<K>[] | undefined, key: K | null): number {
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
        <Table
          containerProps={{
            className: 'max-h-[32rem] overflow-auto rounded-lg',
            tabIndex: 0,
            role: 'region',
            'aria-label': 'جدول الضبوط حسب نوع الجرم',
          }}
        >
          <TableCaption className="sr-only">
            عدد الضبوط لكل نوع جرم مع الاكتشاف والنتيجة
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className={cn(FROZEN_HEAD, FROZEN_COLUMN, 'z-20')}>نوع الجرم</TableHead>
              <TableHead className={cn(FROZEN_HEAD, 'text-center')}>المجموع</TableHead>
              <TableHead className={cn(FROZEN_HEAD, 'text-center')}>مكتشف</TableHead>
              <TableHead className={cn(FROZEN_HEAD, 'text-center')}>غير مكتشف</TableHead>
              {RESULT_COLUMNS.map((result) => (
                <TableHead key={String(result)} className={cn(FROZEN_HEAD, 'text-center')}>
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
                  <TableCell className={cn(FROZEN_COLUMN, 'z-[5] bg-card font-medium')}>
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
                    <TableCell key={String(result)} className="text-center tabular-nums">
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
