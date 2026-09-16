import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TypeCount {
  name: string;
  count: number;
}

const BAR_COLORS = ['#428177', '#b9a779', '#6b1f2a', '#054239', '#988561', '#002623'];

export function ReportsByTypeChart({ data }: { data: TypeCount[] }) {
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>الضبوط حسب النوع</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-border-subtle)' }}
                contentStyle={{
                  direction: 'rtl',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: 13,
                }}
                formatter={(value: number) => [value, 'عدد الضبوط']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
