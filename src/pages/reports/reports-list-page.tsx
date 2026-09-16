import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useReports } from '@/hooks/reports/use-reports';
import { useDebouncedValue } from '@/hooks/shared/use-debounced-value';
import { ReportsTable } from '@/components/reports/reports-table';
import { ReportFilters } from '@/components/reports/report-filters';
import { CreateReportDialog } from '@/components/reports/create-report-dialog';
import { ReportDetailDialog } from '@/components/reports/report-detail-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportListParams } from '@/types/report';

function paramsFromSearch(params: URLSearchParams): ReportListParams {
  return {
    page: params.has('page') ? Number(params.get('page')) : 0,
    typeId: params.has('typeId') ? Number(params.get('typeId')) : undefined,
    creatorId: params.get('creatorId') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    sort: params.get('sort') ?? undefined,
  };
}

function searchFromParams(value: ReportListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (value.page) params.set('page', String(value.page));
  if (value.typeId !== undefined) params.set('typeId', String(value.typeId));
  if (value.creatorId) params.set('creatorId', value.creatorId);
  if (value.from) params.set('from', value.from);
  if (value.to) params.set('to', value.to);
  if (value.sort) params.set('sort', value.sort);
  return params;
}

export function ReportsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsFromSearch(searchParams);
  const { data, isPending, isError, isFetching } = useReports(filters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const viewId = searchParams.has('view') ? Number(searchParams.get('view')) : null;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const filteredReports = useMemo(() => {
    if (!data) return [];
    if (!debouncedSearch) return data.content;
    return data.content.filter((report) =>
      report.reportNumber.toLowerCase().includes(debouncedSearch),
    );
  }, [data, debouncedSearch]);

  const updateFilters = (value: ReportListParams) => setSearchParams(searchFromParams(value));

  const closeDetail = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('view');
    setSearchParams(params);
  };

  return (
    <>
      <Helmet>
        <title>الضبوط</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>الضبوط</CardTitle>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            <span>إنشاء ضبط</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReportFilters
            value={filters}
            onChange={updateFilters}
            search={search}
            onSearchChange={setSearch}
          />

          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل الضبوط. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && (
            <>
              <ReportsTable reports={filteredReports} />
              {debouncedSearch && filteredReports.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد نتائج مطابقة في هذه الصفحة.
                </p>
              )}
              {!debouncedSearch && (
                <Pagination
                  page={data.number}
                  totalPages={data.totalPages}
                  isFetching={isFetching}
                  onPageChange={(page) => updateFilters({ ...filters, page })}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CreateReportDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ReportDetailDialog
        reportId={viewId}
        open={viewId !== null && !Number.isNaN(viewId)}
        onOpenChange={(open) => !open && closeDetail()}
      />
    </>
  );
}
