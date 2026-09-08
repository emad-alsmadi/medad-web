import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-[42px] w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-3.5 py-2 pe-9 text-sm font-medium text-foreground shadow-xs transition-all duration-syid ease-out hover:border-syid-gold-dark/50 hover:shadow-syid focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-85 disabled:shadow-none aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute end-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-syid">
        <ChevronDown className="h-4 w-4" />
      </span>
    </div>
  ),
);
Select.displayName = 'Select';
