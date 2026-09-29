import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileSpreadsheet, Plus, SearchX, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useReports } from '@/hooks/reports/use-reports';
import { useExportReports } from '@/hooks/reports/use-report-mutations';
import { useDebouncedValue } from '@/hooks/shared/use-debounced-value';
import {
  REPORT_FORM_NEEDS_FORM_TYPES,
  useReportPermissions,
} from '@/hooks/reports/use-report-permissions';
import { ReportsTable } from '@/components/reports/reports-table';
import { ReportFilters } from '@/components/reports/report-filters';
import { CreateReportDialog } from '@/components/reports/create-report-dialog';
import { ReportDetailDialog } from '@/components/reports/report-detail-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportListParams, ReportResult, ReportType } from '@/types/report';

const REPORT_TYPES: readonly ReportType[] = [
  'JUDICIAL',
  'ADMINISTRATIVE',
  'RESISTANCE',
  'CRIMINAL',
  'DETENTION_RELEASE',
];
const REPORT_RESULTS: readonly ReportResult[] = [
  'CLOSED',
  'UNDER_INVESTIGATION',
  'FURTHER_INVESTIGATION',
];

function numberParam(params: URLSearchParams, name: string): number | undefined {
  const raw = params.get(name);
  if (raw === null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** A page index is a non-negative integer; anything else (abc, -1, 1.5) is treated as absent. */
function pageParam(params: URLSearchParams): number | undefined {
  const value = numberParam(params, 'page');
  return value !== undefined && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** Ignores an unknown enum value in the URL rather than sending it (the backend 400s). */
function enumParam<T extends string>(params: URLSearchParams, name: string, allowed: readonly T[]) {
  const raw = params.get(name);
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function paramsFromSearch(params: URLSearchParams): ReportListParams {
  return {
    page: pageParam(params) ?? 0,
    // `typeId` is the pre-rename name, kept so old bookmarked links still filter.
    formTypeId: numberParam(params, 'formTypeId') ?? numberParam(params, 'typeId'),
    type: enumParam(params, 'type', REPORT_TYPES),
    crimeTypeId: numberParam(params, 'crimeTypeId'),
    result: enumParam(params, 'result', REPORT_RESULTS),
    creatorId: numberParam(params, 'creatorId'),
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    sort: params.get('sort') ?? undefined,
  };
}

function searchFromParams(value: ReportListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (value.page) params.set('page', String(value.page));
  if (value.formTypeId !== undefined) params.set('formTypeId', String(value.formTypeId));
  if (value.type) params.set('type', value.type);
  if (value.crimeTypeId !== undefined) params.set('crimeTypeId', String(value.crimeTypeId));
  if (value.result) params.set('result', value.result);
  if (value.creatorId !== undefined) params.set('creatorId', String(value.creatorId));
  if (value.from) params.set('from', value.from);
  if (value.to) params.set('to', value.to);
  if (value.sort) params.set('sort', value.sort);
  return params;
}

export function ReportsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsFromSearch(searchParams);
  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useReports(filters);
  const exportMutation = useExportReports();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { canCreate, formNeedsFormTypes } = useReportPermissions();
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

  // A stale or hand-edited ?page= (abc, past the last page) is corrected in the URL
  // instead of showing «لا توجد ضبوط» for a list that has reports.
  const rawPage = searchParams.get('page');
  const lastPage = data && !isPlaceholderData ? Math.max(data.totalPages - 1, 0) : undefined;
  const pageFix =
    rawPage !== null && pageParam(searchParams) === undefined
      ? 0
      : lastPage !== undefined && (filters.page ?? 0) > lastPage
        ? lastPage
        : undefined;
  useEffect(() => {
    if (pageFix === undefined) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (pageFix > 0) next.set('page', String(pageFix));
        else next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [pageFix, setSearchParams]);

  const exportCurrent = () => {
    // Same filters as the list, without paging/sorting (the register is always by date, ascending).
    const { formTypeId, type, crimeTypeId, result, creatorId, from, to } = filters;
    exportMutation.mutate({ formTypeId, type, crimeTypeId, result, creatorId, from, to });
  };

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
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>الضبوط</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportCurrent}
              disabled={exportMutation.isPending || data?.totalElements === 0}
              title="تصدير كل الضبوط المطابقة للفلاتر الحالية إلى ملف Excel"
            >
              <FileSpreadsheet />
              <span>{exportMutation.isPending ? 'جاري التصدير…' : 'تصدير Excel'}</span>
            </Button>
            {canCreate &&
              (formNeedsFormTypes ? (
                // aria-disabled, not disabled: it stays focusable and hoverable, so the reason shows.
                <Button
                  size="sm"
                  aria-disabled="true"
                  title={REPORT_FORM_NEEDS_FORM_TYPES}
                  className="cursor-not-allowed opacity-50"
                >
                  <Plus />
                  <span>إنشاء ضبط</span>
                  <span className="sr-only">{REPORT_FORM_NEEDS_FORM_TYPES}</span>
                </Button>
              ) : (
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus />
                  <span>إنشاء ضبط</span>
                </Button>
              ))}
          </div>
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
            <EmptyState
              icon={TriangleAlert}
              variant="destructive"
              title="فشل تحميل الضبوط"
              description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
              action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
            />
          )}

          {!isError && data && (
            <>
              <ReportsTable reports={filteredReports} />
              {debouncedSearch && filteredReports.length === 0 && (
                <EmptyState
                  icon={SearchX}
                  title="لا توجد نتائج"
                  description="لا توجد نتائج مطابقة في هذه الصفحة."
                />
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
