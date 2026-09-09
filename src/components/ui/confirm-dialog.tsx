import { useRef } from 'react';
import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, Check, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: ReactNode;
  /** Name of the affected item, shown as a chip (e.g. the record being deleted). */
  itemLabel?: string;
  /** Extra detail block, e.g. an error message — styled as a danger callout. */
  detail?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** 'confirm' renders a warning icon and a danger confirm button; 'info' renders a neutral variant. */
  variant?: 'confirm' | 'info';
  isConfirming?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  itemLabel,
  detail,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  onConfirm,
  variant = 'confirm',
  isConfirming = false,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="confirm-dialog-backdrop">
          <DialogPrimitive.Content
            className={cn('confirm-dialog', variant === 'info' && 'confirm-dialog--info')}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              cancelButtonRef.current?.focus();
            }}
          >
            <div
              className={cn(
                'confirm-dialog__icon',
                variant === 'info' && 'confirm-dialog__icon--info',
              )}
            >
              {variant === 'info' ? <Check /> : <AlertTriangle />}
            </div>

            <DialogPrimitive.Title className="confirm-dialog__title">
              {title}
            </DialogPrimitive.Title>

            {message && (
              <DialogPrimitive.Description className="confirm-dialog__message">
                {message}
              </DialogPrimitive.Description>
            )}

            {itemLabel && (
              <div className="confirm-dialog__item">
                <Tag />
                <span>{itemLabel}</span>
              </div>
            )}

            {detail && <div className="confirm-dialog__detail">{detail}</div>}

            <div className="confirm-dialog__actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenChange(false)}
                disabled={isConfirming}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={cn('btn', variant === 'info' ? 'btn-primary' : 'btn-danger')}
                onClick={onConfirm}
                disabled={isConfirming}
              >
                {variant === 'confirm' && <AlertTriangle />}
                {confirmLabel}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
