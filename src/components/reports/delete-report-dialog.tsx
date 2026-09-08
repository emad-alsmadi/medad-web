import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteReport } from '@/hooks/reports/use-report-mutations';
import type { ReportResponse } from '@/types/report';

interface DeleteReportDialogProps {
  report: ReportResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteReportDialog({
  report,
  open,
  onOpenChange,
  onDeleted,
}: DeleteReportDialogProps) {
  const mutation = useDeleteReport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>حذف التقرير</DialogTitle>
        <DialogDescription>
          هل أنت متأكد من حذف التقرير <strong>{report.reportNumber}</strong>؟ لا يمكن التراجع عن هذا
          الإجراء.
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
              mutation.mutate(report.id, {
                onSuccess: () => {
                  onOpenChange(false);
                  onDeleted?.();
                },
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
