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
  /** Marks the field as required, showing an asterisk next to its label. */
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  className,
  children,
  labelExtra,
  required,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </Label>
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
