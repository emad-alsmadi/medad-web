import { useState } from 'react';
import { FolderTree } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/empty-state';
import { FormTypeForm } from '@/components/form-types/form-type-form';
import { DeleteFormTypeDialog } from '@/components/form-types/delete-form-type-dialog';
import { FormTypeTemplateForm } from '@/components/form-types/form-type-template-form';
import { useCan } from '@/hooks/auth/use-can';
import { isSelectableFormType } from '@/types/form-type';
import type { FormTypeResponse } from '@/types/form-type';

interface FormTypeTableProps {
  /** The rows to show (one page). */
  types: FormTypeResponse[];
  /** Every form type, to name a parent that sits on another page. */
  allTypes: FormTypeResponse[];
}

export function FormTypeTable({ types, allTypes }: FormTypeTableProps) {
  const can = useCan();
  const [editing, setEditing] = useState<FormTypeResponse | null>(null);
  const [deleting, setDeleting] = useState<FormTypeResponse | null>(null);
  const [managingTemplate, setManagingTemplate] = useState<FormTypeResponse | null>(null);

  const nameById = new Map(allTypes.map((t) => [t.id, t.name]));

  return (
    <>
      <Table>
        <TableCaption className="sr-only">نماذج الضبوط</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>عدد الشهود</TableHead>
            <TableHead>التصنيف الأب</TableHead>
            <TableHead>الفروع</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState icon={FolderTree} title="لا توجد نماذج ضبوط" />
              </TableCell>
            </TableRow>
          )}
          {types.map((type) => (
            <TableRow key={type.id}>
              <TableCell>{type.name}</TableCell>
              <TableCell>{type.witnessNumber}</TableCell>
              <TableCell>
                {type.parentId !== undefined ? (nameById.get(type.parentId) ?? '—') : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {isSelectableFormType(type) ? '—' : `تصنيف (${type.childrenCount ?? 0})`}
              </TableCell>
              <TableCell className="space-x-2 text-end rtl:space-x-reverse">
                {isSelectableFormType(type) && (
                  <Button variant="ghost" size="sm" onClick={() => setManagingTemplate(type)}>
                    النص
                  </Button>
                )}
                {can('FORM_TYPES', 'UPDATE') && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(type)}>
                    تعديل
                  </Button>
                )}
                {can('FORM_TYPES', 'DELETE') && (
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(type)}>
                    حذف
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <FormTypeForm formType={editing} open onOpenChange={(open) => !open && setEditing(null)} />
      )}
      {deleting && (
        <DeleteFormTypeDialog
          formType={deleting}
          open
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      )}
      {managingTemplate && (
        <FormTypeTemplateForm
          formType={managingTemplate}
          open
          onOpenChange={(open) => !open && setManagingTemplate(null)}
        />
      )}
    </>
  );
}
