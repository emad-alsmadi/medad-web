import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The mixed state of a "select all" box whose items are only partly checked. */
  indeterminate?: boolean;
}

/** A native checkbox (keyboard, forms and screen readers for free), styled to the design system. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, indeterminate = false, className, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    // `indeterminate` has no HTML attribute; it can only be set on the element.
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <input
        ref={innerRef}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className={cn(
          'h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = 'Checkbox';
