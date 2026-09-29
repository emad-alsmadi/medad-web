import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, TriangleAlert } from 'lucide-react';
import { useRoles } from '@/hooks/roles/use-roles';
import { useCan } from '@/hooks/auth/use-can';
import { RolesTable } from '@/components/roles/roles-table';
import { RoleFormDialog } from '@/components/roles/role-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** GET /roles is a plain array — few enough rows that it isn't paged. */
export function RolesListPage() {
  const { data, isPending, isError, refetch } = useRoles();
  const canCreate = useCan()('ROLES', 'CREATE');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>الأدوار والصلاحيات · الإدارة</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>الأدوار والصلاحيات</CardTitle>
          {canCreate && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus />
              <span>دور جديد</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              icon={TriangleAlert}
              variant="destructive"
              title="فشل تحميل الأدوار"
              description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
              action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
            />
          )}

          {data && !isError && <RolesTable roles={data} />}
        </CardContent>
      </Card>

      {canCreate && isCreateOpen && <RoleFormDialog open onOpenChange={setIsCreateOpen} />}
    </>
  );
}
