import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, SearchX, TriangleAlert } from 'lucide-react';
import { useFormTypes, useFormTypesTree } from '@/hooks/form-types/use-form-types';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { useDebouncedValue } from '@/hooks/shared/use-debounced-value';
import { useCan } from '@/hooks/auth/use-can';
import { FormTypeTable } from '@/components/form-types/form-type-table';
import { FormTypeTree } from '@/components/form-types/form-type-tree';
import { FormTypeForm } from '@/components/form-types/form-type-form';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { matchesSearch } from '@/lib/utils/text';

type ViewMode = 'list' | 'tree';

export function FormTypesListPage() {
  const canCreate = useCan()('FORM_TYPES', 'CREATE');
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<ViewMode>('list');

  return (
    <>
      <Helmet>
        <title>نماذج الضبوط</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>نماذج الضبوط</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border-subtle p-0.5">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(view === 'list' && 'shadow-sm')}
                onClick={() => setView('list')}
              >
                قائمة
              </Button>
              <Button
                variant={view === 'tree' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(view === 'tree' && 'shadow-sm')}
                onClick={() => setView('tree')}
              >
                عرض شجري
              </Button>
            </div>
            {canCreate && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                <span>نموذج جديد</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {view === 'list' ? (
            <FormTypesListView />
          ) : (
            <FormTypesTreeView />
          )}
        </CardContent>
      </Card>

      {creating && <FormTypeForm open onOpenChange={setCreating} />}
    </>
  );
}

function FormTypesListView() {
  const { data, isPending, isError, refetch } = useFormTypes();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filtered = useMemo(
    () => (data ?? []).filter((t) => matchesSearch(t.name, debouncedSearch)),
    [data, debouncedSearch],
  );
  const { page, totalPages, pageItems, setPage } = useClientPagination(filtered);

  if (isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={TriangleAlert}
        variant="destructive"
        title="فشل تحميل نماذج الضبوط"
        description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
        action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
      />
    );
  }

  return (
    <>
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
      {filtered.length === 0 && debouncedSearch.trim() ? (
        <EmptyState icon={SearchX} title="لا توجد نماذج مطابقة" />
      ) : (
        <>
          <FormTypeTable types={pageItems} allTypes={data} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

function FormTypesTreeView() {
  const { data, isPending, isError, refetch } = useFormTypesTree();

  if (isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={TriangleAlert}
        variant="destructive"
        title="فشل تحميل نماذج الضبوط"
        description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
        action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
      />
    );
  }

  return <FormTypeTree nodes={data ?? []} />;
}
