import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  ReportFormFields,
  ReportFormSubmitButton,
  reportFormValuesToBody,
  applyReportFormApiError,
  useReportForm,
} from '@/components/reports/report-form';
import { useCreateReport } from '@/hooks/reports/use-report-mutations';
import { ROUTES } from '@/constant/routes';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReportDialog({ open, onOpenChange }: CreateReportDialogProps) {
  const navigate = useNavigate();
  const mutation = useCreateReport();
  const form = useReportForm();
  const {
    handleSubmit,
    setError,
    reset,
  } = form;

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(reportFormValuesToBody(values), {
      onSuccess: (data) => {
        reset();
        onOpenChange(false);
        void navigate(ROUTES.reports.detail(data.id));
      },
      onError: (error) => applyReportFormApiError(error, setError),
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] rounded-[6px]">
        <DialogTitle>إنشاء ضبط</DialogTitle>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <ReportFormFields form={form} />
          <ReportFormSubmitButton isPending={mutation.isPending} isEdit={false} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
