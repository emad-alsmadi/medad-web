import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}
