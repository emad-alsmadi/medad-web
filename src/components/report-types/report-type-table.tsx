import { useState } from 'react';
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
import { ReportTypeForm } from '@/components/report-types/report-type-form';
import { DeleteReportTypeDialog } from '@/components/report-types/delete-report-type-dialog';
import type { ReportTypeResponse } from '@/types/report-type';

interface ReportTypeTableProps {
  types: ReportTypeResponse[];
  canManage: boolean;
}

export function ReportTypeTable({ types, canManage }: ReportTypeTableProps) {
  const [editing, setEditing] = useState<ReportTypeResponse | null>(null);
  const [deleting, setDeleting] = useState<ReportTypeResponse | null>(null);

  if (types.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد أنواع تقارير.</p>;
  }

  const nameById = new Map(types.map((t) => [t.id, t.name]));

  return (
    <>
      <Table>
        <TableCaption className="sr-only">أنواع التقارير</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>عدد الشهود</TableHead>
            <TableHead>النوع الأب</TableHead>
            {canManage && <TableHead className="text-end">الإجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.name}</TableCell>
              <TableCell>{type.witnessNumber}</TableCell>
              <TableCell>
                {type.parentId !== undefined ? (nameById.get(type.parentId) ?? '—') : '—'}
              </TableCell>
              {canManage && (
                <TableCell className="space-x-2 text-end rtl:space-x-reverse">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(type)}>
                    تعديل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(type)}>
                    حذف
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <ReportTypeForm
          reportType={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteReportTypeDialog
          reportType={deleting}
          open
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      )}
    </>
  );
}
