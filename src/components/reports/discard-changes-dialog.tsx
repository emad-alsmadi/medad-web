import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

/** Asked before leaving a report form that has unsaved input. */
export function DiscardChangesDialog({ open, onOpenChange, onDiscard }: DiscardChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تجاهل التغييرات؟"
      message="لديك تغييرات غير محفوظة في هذا الضبط، وستضيع إن غادرت الآن."
      confirmLabel="تجاهل التغييرات"
      cancelLabel="متابعة التعديل"
      onConfirm={onDiscard}
    />
  );
}
