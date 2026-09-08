import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-[42px] w-full rounded-md border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-none transition-all duration-syid ease-out placeholder:text-muted-foreground hover:border-syid-gold-dark/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-85 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
