import { useState } from 'react';
import { Gavel } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { CrimeTypeFormDialog } from '@/components/crime-types/crime-type-form-dialog';
import { useDeleteCrimeType } from '@/hooks/crime-types/use-crime-type-mutations';
import type { CrimeTypeResponse } from '@/types/crime-type';

interface CrimeTypesTableProps {
  crimeTypes: CrimeTypeResponse[];
  /** Row number of the first item, for the "م" column across pages. */
  offset: number;
  /** ADMIN only: edit/delete actions (everyone else gets a read-only list). */
  canManage: boolean;
}

export function CrimeTypesTable({ crimeTypes, offset, canManage }: CrimeTypesTableProps) {
  const [editing, setEditing] = useState<CrimeTypeResponse | null>(null);
  const [deleting, setDeleting] = useState<CrimeTypeResponse | null>(null);
  const deleteMutation = useDeleteCrimeType();

  return (
    <>
      <Table>
        <TableCaption className="sr-only">أنواع الجرم</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">م</TableHead>
            <TableHead>الاسم</TableHead>
            {canManage && <TableHead className="text-end">الإجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {crimeTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 3 : 2} className="p-0">
                <EmptyState icon={Gavel} title="لا توجد أنواع جرم" />
              </TableCell>
            </TableRow>
          )}
          {crimeTypes.map((crimeType, i) => (
            <TableRow key={crimeType.id}>
              <TableCell className="text-muted-foreground">{offset + i + 1}</TableCell>
              <TableCell>{crimeType.name}</TableCell>
              {canManage && (
                <TableCell className="space-x-2 text-end rtl:space-x-reverse">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(crimeType)}>
                    تعديل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(crimeType)}>
                    حذف
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <CrimeTypeFormDialog
          crimeType={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف نوع الجرم"
        message="لا يمكن حذف نوع مستخدم في ضبوط قائمة، ولا يمكن التراجع عن الحذف."
        itemLabel={deleting?.name}
        confirmLabel="حذف"
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleting &&
          deleteMutation.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </>
  );
}
