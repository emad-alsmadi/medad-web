import { Skeleton } from '@/components/ui/skeleton';

export function RouteFallback() {
  return (
    <div className="space-y-2 p-6" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">جاري التحميل…</span>
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
