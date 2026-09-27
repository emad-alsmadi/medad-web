import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ReportFormActions, ReportFormFields } from '@/components/reports/report-form';
import {
  applyReportFormApiError,
  reportFormValuesToBody,
  useReportForm,
} from '@/components/reports/report-form-schema';
import { useCreateReport } from '@/hooks/reports/use-report-mutations';
import { ROUTES } from '@/constant/routes';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The create form in a large dialog: a fixed header and action bar with
 * only the form between them scrolling. Once something is typed, a stray
 * click outside or Escape no longer closes it (and loses the input) —
 * closing then takes the explicit Cancel or ✕.
 */
export function CreateReportDialog({ open, onOpenChange }: CreateReportDialogProps) {
  const navigate = useNavigate();
  const mutation = useCreateReport();
  const form = useReportForm();
  const {
    handleSubmit,
    setError,
    reset,
    formState: { isDirty, errors },
  } = form;

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(reportFormValuesToBody(values), {
      onSuccess: (data) => {
        close();
        void navigate(`${ROUTES.reports.list}?view=${data.id}`);
      },
      onError: (error) => applyReportFormApiError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent
        className="flex h-[min(92vh,56rem)] max-h-none w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl p-0"
        onInteractOutside={(e) => isDirty && e.preventDefault()}
        onEscapeKeyDown={(e) => isDirty && e.preventDefault()}
      >
        <header className="border-b border-border-subtle px-6 py-4 pe-12">
          <DialogTitle>إنشاء ضبط</DialogTitle>
          <DialogDescription className="mt-1.5">
            الحقول المعلَّمة بـ <span className="text-destructive">*</span> مطلوبة، وبقية
            الأقسام اختيارية يمكن فتحها عند الحاجة.
          </DialogDescription>
        </header>

        <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-background/60 px-6 py-5">
            <ReportFormFields form={form} isEdit={false} />
          </div>
          <footer className="border-t border-border-subtle bg-card px-6 py-3">
            <ReportFormActions
              isPending={mutation.isPending}
              isEdit={false}
              error={errors.root?.message}
              onCancel={close}
            />
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
