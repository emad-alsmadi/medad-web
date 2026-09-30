import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'react-router-dom';
import { useChangePassword } from '@/hooks/auth/use-change-password';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { failureMessage, tooManyAttemptsMessage } from '@/lib/api/errors';
import {
  PASSWORD_HINT,
  PASSWORD_MATCHES_EMAIL,
  matchesEmail,
  newPasswordSchema,
} from '@/lib/auth/password-policy';
import type { ApiErrorBody } from '@/types/api';

/** The header's «تغيير كلمة المرور» links here. */
export const CHANGE_PASSWORD_ANCHOR = 'change-password';

function changePasswordSchema(email: string) {
  return z
    .object({
      currentPassword: z.string().min(1, 'أدخل كلمة المرور الحالية'),
      newPassword: newPasswordSchema,
      confirmPassword: z.string().min(1, 'أعد كتابة كلمة المرور الجديدة'),
    })
    .superRefine((values, ctx) => {
      if (values.newPassword === values.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: 'يجب أن تختلف عن كلمة المرور الحالية',
        });
      }
      if (matchesEmail(values.newPassword, email)) {
        ctx.addIssue({ code: 'custom', path: ['newPassword'], message: PASSWORD_MATCHES_EMAIL });
      }
      if (values.confirmPassword !== values.newPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'كلمتا المرور غير متطابقتين',
        });
      }
    });
}

type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;

const EMPTY: ChangePasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordCard({ email }: { email: string }) {
  const mutation = useChangePassword();
  const schema = useMemo(() => changePasswordSchema(email), [email]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  // Arriving from the header's menu item (#change-password): bring the card into view.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== `#${CHANGE_PASSWORD_ANCHOR}`) return;
    document
      .getElementById(CHANGE_PASSWORD_ANCHOR)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    setFocus('currentPassword');
  }, [hash, setFocus]);

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    mutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => reset(EMPTY),
        onError: (error) => {
          const body = error instanceof ApiError ? (error.details as ApiErrorBody) : undefined;
          if (error instanceof ApiError && error.status === 400 && !body?.fieldErrors) {
            setError('currentPassword', { message: 'كلمة المرور الحالية غير صحيحة' });
            return;
          }
          if (error instanceof ApiError && error.status === 400) {
            setError('newPassword', { message: 'رفض الخادم كلمة المرور الجديدة' });
            return;
          }
          setError('root', {
            message:
              tooManyAttemptsMessage(error) ??
              failureMessage(error, 'تعذر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.'),
          });
        },
      },
    );
  });

  return (
    <Card id={CHANGE_PASSWORD_ANCHOR} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>تغيير كلمة المرور</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="max-w-md space-y-4">
          <FormField
            label="كلمة المرور الحالية"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
            required
          >
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...register('currentPassword')}
            />
          </FormField>
          <FormField
            label="كلمة المرور الجديدة"
            htmlFor="newPassword"
            error={errors.newPassword?.message}
            hint={PASSWORD_HINT}
            required
          >
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              {...register('newPassword')}
            />
          </FormField>
          <FormField
            label="تأكيد كلمة المرور الجديدة"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
            required
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </FormField>
          {errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            بعد التغيير يُسجَّل خروجك من الأجهزة والمتصفحات الأخرى، وتبقى جلستك هذه.
          </p>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الحفظ…' : 'تغيير كلمة المرور'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
