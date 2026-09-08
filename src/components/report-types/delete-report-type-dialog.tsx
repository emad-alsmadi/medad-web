import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteReportType } from '@/hooks/report-types/use-report-type-mutations';
import type { ReportTypeResponse } from '@/types/report-type';

interface DeleteReportTypeDialogProps {
  reportType: ReportTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteReportTypeDialog({
  reportType,
  open,
  onOpenChange,
}: DeleteReportTypeDialogProps) {
  const mutation = useDeleteReportType();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>حذف نوع التقرير</DialogTitle>
        <DialogDescription>
          هل أنت متأكد من حذف <strong>{reportType.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
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
              mutation.mutate(reportType.id, {
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
