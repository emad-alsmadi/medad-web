import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, TriangleAlert } from 'lucide-react';
import { useCrimeTypes } from '@/hooks/crime-types/use-crime-types';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { useDebouncedValue } from '@/hooks/shared/use-debounced-value';
import { useAuthContext } from '@/contexts/auth-context';
import { CrimeTypesTable } from '@/components/crime-types/crime-types-table';
import { CrimeTypeFormDialog } from '@/components/crime-types/crime-type-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 15;

/**
 * نوع الجرم list, under the reports menu: readable by everyone, managed
 * (add/edit/delete) by ADMIN only — the backend enforces the same split.
 * /crime-types is a plain array, searched and paged client-side.
 */
export function CrimeTypesListPage() {
  const { user } = useAuthContext();
  const canManage = user?.role === 'ADMIN';
  const { data, isPending, isError, refetch } = useCrimeTypes();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => !debouncedSearch || c.name.includes(debouncedSearch)),
    [data, debouncedSearch],
  );
  const { page, totalPages, pageItems, setPage } = useClientPagination(filtered, PAGE_SIZE);

  return (
    <>
      <Helmet>
        <title>أنواع الجرم</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>أنواع الجرم</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus />
              <span>نوع جديد</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="بحث بالاسم"
              placeholder="بحث بالاسم…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pe-9"
            />
          </div>

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
              title="فشل تحميل أنواع الجرم"
              description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
              action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
            />
          )}

          {!isPending && !isError && (
            <>
              <CrimeTypesTable
                crimeTypes={pageItems}
                offset={page * PAGE_SIZE}
                canManage={canManage}
              />
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {canManage && isCreateOpen && <CrimeTypeFormDialog open onOpenChange={setIsCreateOpen} />}
    </>
  );
}
