import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'forest' | 'gold' | 'umber';
  hint?: string;
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  forest: 'bg-syid-forest/10 text-syid-forest-dark',
  gold: 'bg-syid-gold/15 text-syid-gold-dark',
  umber: 'bg-syid-umber/10 text-syid-umber',
};

export function StatCard({ label, value, icon, accent = 'forest', hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6',
            accentClasses[accent],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
