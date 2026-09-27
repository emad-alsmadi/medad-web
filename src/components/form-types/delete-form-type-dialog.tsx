import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteFormType } from '@/hooks/form-types/use-form-type-mutations';
import type { FormTypeResponse } from '@/types/form-type';

interface DeleteFormTypeDialogProps {
  formType: FormTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFormTypeDialog({
  formType,
  open,
  onOpenChange,
}: DeleteFormTypeDialogProps) {
  const mutation = useDeleteFormType();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>حذف نموذج الضبط</DialogTitle>
        <DialogDescription>
          هل أنت متأكد من حذف <strong>{formType.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
        </DialogDescription>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(formType.id, {
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            {mutation.isPending ? 'جاري الحذف…' : 'حذف'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
