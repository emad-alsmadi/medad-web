import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useReports } from '@/hooks/reports/use-reports';
import { ReportsTable } from '@/components/reports/reports-table';
import { ReportFilters } from '@/components/reports/report-filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';
import type { ReportListParams } from '@/types/report';

function paramsFromSearch(params: URLSearchParams): ReportListParams {
  return {
    page: params.has('page') ? Number(params.get('page')) : 0,
    typeId: params.has('typeId') ? Number(params.get('typeId')) : undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    sort: params.get('sort') ?? undefined,
  };
}

function searchFromParams(value: ReportListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (value.page) params.set('page', String(value.page));
  if (value.typeId !== undefined) params.set('typeId', String(value.typeId));
  if (value.from) params.set('from', value.from);
  if (value.to) params.set('to', value.to);
  if (value.sort) params.set('sort', value.sort);
  return params;
}

export function ReportsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsFromSearch(searchParams);
  const { data, isPending, isError, isFetching } = useReports(filters);

  const updateFilters = (value: ReportListParams) => setSearchParams(searchFromParams(value));

  return (
    <>
      <Helmet>
        <title>التقارير</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>التقارير</CardTitle>
          <Button size="sm" asChild>
            <Link to={ROUTES.reports.create}>إنشاء تقرير</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters value={filters} onChange={updateFilters} />

          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل التقارير. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && (
            <>
              <ReportsTable reports={data.content} />
              <Pagination
                page={data.number}
                totalPages={data.totalPages}
                isFetching={isFetching}
                onPageChange={(page) => updateFilters({ ...filters, page })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
