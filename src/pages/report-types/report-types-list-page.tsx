import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus } from 'lucide-react';
import { useReportTypes, useReportTypesTree } from '@/hooks/report-types/use-report-types';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { useAuthContext } from '@/contexts/auth-context';
import { ReportTypeTable } from '@/components/report-types/report-type-table';
import { ReportTypeTree } from '@/components/report-types/report-type-tree';
import { ReportTypeForm } from '@/components/report-types/report-type-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

type ViewMode = 'list' | 'tree';

export function ReportTypesListPage() {
  const { user } = useAuthContext();
  const canManage = user?.role === 'ADMIN';
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<ViewMode>('list');

  return (
    <>
      <Helmet>
        <title>أنواع الضبوط</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>أنواع الضبوط</CardTitle>
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
            {canManage && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                <span>نوع جديد</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {view === 'list' ? (
            <ReportTypesListView canManage={canManage} />
          ) : (
            <ReportTypesTreeView />
          )}
        </CardContent>
      </Card>

      {creating && <ReportTypeForm open onOpenChange={setCreating} />}
    </>
  );
}

function ReportTypesListView({ canManage }: { canManage: boolean }) {
  const { data, isPending, isError } = useReportTypes();
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
      <p role="alert" className="text-sm text-destructive">
        فشل تحميل أنواع الضبوط. يرجى المحاولة مرة أخرى.
      </p>
    );
  }

  return (
    <>
      <ReportTypeTable types={pageItems} canManage={canManage} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

function ReportTypesTreeView() {
  const { data, isPending, isError } = useReportTypesTree();

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
      <p role="alert" className="text-sm text-destructive">
        فشل تحميل أنواع الضبوط. يرجى المحاولة مرة أخرى.
      </p>
    );
  }

  return <ReportTypeTree nodes={data ?? []} />;
}
