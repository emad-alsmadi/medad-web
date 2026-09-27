import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  variant?: 'default' | 'destructive';
  className?: string;
}

/**
 * Centered placeholder for a section with nothing (or nothing usable) to
 * show — an empty list, a filtered-out result set, or a failed fetch.
 * Shared so every list in the app renders the same "nothing here" look
 * instead of each page inventing its own <p> variant.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      role={variant === 'destructive' ? 'alert' : undefined}
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full',
          variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button type="button" variant="outline" size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}
