import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { riseIn } from '@/motion/variants';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'forest' | 'gold' | 'umber';
  hint?: ReactNode;
}

const accentClasses: Record<
  NonNullable<StatCardProps['accent']>,
  { chip: string; glow: string }
> = {
  forest: { chip: 'bg-syid-forest/10 text-syid-forest-dark', glow: 'bg-syid-forest/[0.07]' },
  gold: { chip: 'bg-syid-gold/15 text-syid-gold-dark', glow: 'bg-syid-gold/[0.12]' },
  umber: { chip: 'bg-syid-umber/10 text-syid-umber', glow: 'bg-syid-umber/[0.06]' },
};

/** A headline number. Rises in with its siblings when inside a `staggerChildren` parent. */
export function StatCard({ label, value, icon, accent = 'forest', hint }: StatCardProps) {
  const colors = accentClasses[accent];
  return (
    <motion.div variants={riseIn} className="h-full">
      <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-syid">
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full transition-transform duration-500 group-hover:scale-125',
            colors.glow,
          )}
        />
        <CardContent className="relative flex items-center gap-4 p-5">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 [&>svg]:h-6 [&>svg]:w-6',
              colors.chip,
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
    </motion.div>
  );
}
