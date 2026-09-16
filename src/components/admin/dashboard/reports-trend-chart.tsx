import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MonthCount {
  month: string;
  count: number;
}

export function ReportsTrendChart({ data }: { data: MonthCount[] }) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <Card>
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
                <linearGradient id="reportsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#428177" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#428177" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
              <Tooltip
                contentStyle={{
                  direction: 'rtl',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: 13,
                }}
                formatter={(value: number) => [value, 'عدد الضبوط']}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#428177"
                strokeWidth={2}
                fill="url(#reportsTrendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
