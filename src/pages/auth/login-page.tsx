import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLogin } from '@/hooks/auth/use-login';
import { useAuthContext } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';
import { ROUTES } from '@/constant/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صالحًا'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  return 'حدث خطأ ما. يرجى المحاولة مرة أخرى.';
}

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => void navigate(ROUTES.home, { replace: true }),
    });
  });

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(66,129,119,0.12) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 80%, rgba(185,167,121,0.15) 0%, transparent 55%), hsl(var(--background))',
      }}
    >
      <Helmet>
        <title>تسجيل الدخول · مداد</title>
      </Helmet>
      <Card className="w-full max-w-sm border-t-4 border-t-syid-gold hover:border-t-syid-gold">
        <CardHeader>
          <CardTitle>تسجيل الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            <FormField label="البريد الإلكتروني" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </FormField>
            <FormField label="كلمة المرور" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </FormField>
            {login.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getLoginErrorMessage(login.error)}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
