export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="flex h-full items-center justify-center p-10">
      <span className="text-sm text-muted-foreground">جاري التحميل…</span>
    </div>
  );
}
