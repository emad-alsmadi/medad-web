import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteUser } from '@/hooks/users/use-delete-user';
import type { UserResponse } from '@/types/user';

interface DeleteUserDialogProps {
  user: UserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const mutation = useDeleteUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>حذف المستخدم</DialogTitle>
        <DialogDescription>
          هل أنت متأكد من حذف <strong>{user.fullName}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
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
              mutation.mutate(user.id, {
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
