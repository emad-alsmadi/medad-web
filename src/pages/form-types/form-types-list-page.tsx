import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, TriangleAlert } from 'lucide-react';
import { useFormTypes, useFormTypesTree } from '@/hooks/form-types/use-form-types';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { useCan } from '@/hooks/auth/use-can';
import { FormTypeTable } from '@/components/form-types/form-type-table';
import { FormTypeTree } from '@/components/form-types/form-type-tree';
import { FormTypeForm } from '@/components/form-types/form-type-form';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

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
  const { page, totalPages, pageItems, setPage } = useClientPagination(data ?? []);

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
      <FormTypeTable types={pageItems} allTypes={data} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
