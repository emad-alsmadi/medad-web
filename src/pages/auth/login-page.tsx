import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useLogin } from '@/hooks/auth/use-login';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صالحًا'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * On success this component doesn't navigate itself — GuestOnlyRoute
 * (wrapping /login in the route tree) reacts to the auth-state flip and
 * redirects, honoring the originally requested page via
 * location.state.from. Keeping that in exactly one place avoids two
 * guards computing competing redirect targets on the same render.
 */
export function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values);
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
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
