import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
  /** Optional content rendered inline next to the label (e.g. a dictation button). */
  labelExtra?: ReactNode;
}

export function FormField({ label, htmlFor, error, className, children, labelExtra }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {labelExtra}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
