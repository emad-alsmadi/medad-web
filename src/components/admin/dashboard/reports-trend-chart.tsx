import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MonthCount {
  month: string;
  count: number;
}

const GRADIENT_ID = 'reports-trend-area';

/** Reports per month as a smooth curve rising from the baseline — one series, so one hue; exact counts on hover. */
export function ReportsTrendChart({ data }: { data: MonthCount[] }) {
  const reduceMotion = useReducedMotion();
  const hasData = data.some((point) => point.count > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>الضبوط عبر الزمن</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ left: -12, right: 12, top: 8 }}>
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#428177" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#428177" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-subtle)"
                vertical={false}
              />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                width={32}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: '#054239', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  direction: 'rtl',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: 13,
                }}
                formatter={(value) => [value, 'عدد الضبوط']}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#054239"
                strokeWidth={2.5}
                fill={`url(#${GRADIENT_ID})`}
                dot={{ r: 3, fill: '#054239', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#054239', strokeWidth: 0 }}
                isAnimationActive={!reduceMotion}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
