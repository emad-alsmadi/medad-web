import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constant/routes';

export function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(66,129,119,0.12) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 80%, rgba(185,167,121,0.15) 0%, transparent 55%), hsl(var(--background))',
      }}
    >
      <Helmet>
        <title>الصفحة غير موجودة · مداد</title>
      </Helmet>
      <Card className="w-full max-w-md border-t-4 border-t-syid-gold text-center hover:border-t-syid-gold">
        <CardContent className="space-y-4 pt-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-syid-forest/10 text-syid-forest">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-5xl font-bold text-syid-forest">404</p>
            <h1 className="text-lg font-semibold">الصفحة غير موجودة</h1>
            <p className="text-sm text-muted-foreground">
              الصفحة التي تحاول الوصول إليها غير موجودة أو ربما تم نقلها.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to={ROUTES.reports.list}>العودة إلى الضبوط</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
